/**
 * Tests d'intégration Ollama — nécessitent :
 *   - OrbStack/Docker ou Ollama local sur 11434
 *   - ollama pull llama3.2
 *   - CHAT_AI_INTEGRATION=true pnpm test -- chat-ai-integration
 */
import { checkOllamaHealth, isOllamaConfigured, ollamaChat } from '@/lib/ollama';

const runIntegration = process.env.CHAT_AI_INTEGRATION === 'true';

(runIntegration ? describe : describe.skip)('Chat AI — intégration Ollama', () => {
  beforeAll(() => {
    process.env.CHAT_AI_ENABLED = 'true';
    process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
    process.env.OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2';
  });

  it('CHAT_AI_ENABLED=true active isOllamaConfigured', () => {
    expect(isOllamaConfigured()).toBe(true);
  });

  it('health check Ollama OK avec llama3.2', async () => {
    const health = await checkOllamaHealth();
    expect(health.ok).toBe(true);
    expect(health.model).toBe('llama3.2');
  }, 15_000);

  it('répond à une question MoonSkin courte', async () => {
    const result = await ollamaChat({
      messages: [
        {
          role: 'system',
          content:
            'Tu es l\'assistant MoonSkin (vente skins CS2). Réponds en une phrase courte en français.',
        },
        { role: 'user', content: 'Quel est le délai de trade hold Steam sur MoonSkin ?' },
      ],
      maxTokens: 80,
    });

    expect(result.content.length).toBeGreaterThan(10);
    expect(result.done).toBe(true);
  }, 90_000);
});
