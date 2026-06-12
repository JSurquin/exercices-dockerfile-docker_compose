import {
  checkOllamaHealth,
  getOllamaModel,
  isOllamaConfigured,
  ollamaChat,
} from '@/lib/ollama';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.CHAT_AI_ENABLED;
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;
});

describe('isOllamaConfigured', () => {
  it('est false par défaut (prod sans CHAT_AI_ENABLED)', () => {
    delete process.env.CHAT_AI_ENABLED;
    expect(isOllamaConfigured()).toBe(false);
  });

  it('est true uniquement si CHAT_AI_ENABLED=true', () => {
    process.env.CHAT_AI_ENABLED = 'true';
    expect(isOllamaConfigured()).toBe(true);
    process.env.CHAT_AI_ENABLED = '1';
    expect(isOllamaConfigured()).toBe(false);
  });
});

describe('getOllamaModel', () => {
  it('utilise llama3.2 par défaut', () => {
    expect(getOllamaModel()).toBe('llama3.2');
  });

  it('respecte OLLAMA_MODEL', () => {
    process.env.OLLAMA_MODEL = 'mistral';
    expect(getOllamaModel()).toBe('mistral');
  });
});

describe('ollamaChat', () => {
  it('parse une réponse JSON standard', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          message: { content: '  Réponse IA  ' },
          model: 'llama3.2',
          done: true,
        }),
    }) as unknown as typeof fetch;

    const result = await ollamaChat({
      messages: [{ role: 'user', content: 'Bonjour' }],
    });

    expect(result.content).toBe('Réponse IA');
    expect(result.model).toBe('llama3.2');
    expect(result.done).toBe(true);
  });

  it('parse du NDJSON (dernière ligne done)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '{"message":{"content":"partiel"},"done":false}\n{"message":{"content":"final"},"done":true}',
    }) as unknown as typeof fetch;

    const result = await ollamaChat({
      messages: [{ role: 'user', content: 'test' }],
    });
    expect(result.content).toBe('final');
  });

  it('lève une erreur HTTP', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'service unavailable',
    }) as unknown as typeof fetch;

    await expect(
      ollamaChat({ messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toThrow('Ollama HTTP 503');
  });

  it('lève une erreur si contenu vide', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ message: { content: '   ' } }),
    }) as unknown as typeof fetch;

    await expect(
      ollamaChat({ messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toThrow('Réponse Ollama vide');
  });
});

describe('checkOllamaHealth', () => {
  it('retourne ok si le modèle est présent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'llama3.2:latest' }] }),
    }) as unknown as typeof fetch;

    const health = await checkOllamaHealth();
    expect(health.ok).toBe(true);
    expect(health.model).toBe('llama3.2');
  });

  it('signale un modèle absent', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'mistral:latest' }] }),
    }) as unknown as typeof fetch;

    const health = await checkOllamaHealth();
    expect(health.ok).toBe(false);
    expect(health.error).toContain('llama3.2');
  });

  it('gère une erreur réseau', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const health = await checkOllamaHealth();
    expect(health.ok).toBe(false);
    expect(health.error).toContain('ECONNREFUSED');
  });
});
