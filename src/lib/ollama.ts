import { logger } from '@/lib/logger';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  model?: string;
  messages: OllamaMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface OllamaChatResult {
  content: string;
  model: string;
  done: boolean;
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'llama3.2';
const DEFAULT_TIMEOUT_MS = 60_000;

function getBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
}

export function isOllamaConfigured(): boolean {
  return process.env.CHAT_AI_ENABLED === 'true';
}

export async function ollamaChat(options: OllamaChatOptions): Promise<OllamaChatResult> {
  const model = options.model ?? getOllamaModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: options.messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.4,
          num_predict: options.maxTokens ?? 512,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const rawText = await res.text();

    let data: { message?: { content?: string }; model?: string; done?: boolean };
    try {
      // Ollama peut renvoyer du NDJSON en mode stream: false sur certaines versions
      // On prend la dernière ligne non-vide qui contient done: true
      const lines = rawText.split('\n').filter((l) => l.trim());
      const lastLine = lines[lines.length - 1] ?? '{}';
      data = JSON.parse(lastLine);
    } catch {
      throw new Error(`Réponse Ollama non-JSON: ${rawText.slice(0, 200)}`);
    }

    const content = data.message?.content?.trim();
    if (!content) {
      logger.error('[ollama] Réponse vide — payload brut:', rawText.slice(0, 500));
      throw new Error('Réponse Ollama vide');
    }

    return {
      content,
      model: data.model ?? model,
      done: data.done ?? true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  model: string;
  baseUrl: string;
  error?: string;
}> {
  const baseUrl = getBaseUrl();
  const model = getOllamaModel();

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      return { ok: false, model, baseUrl, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const names = (data.models ?? []).map((m) => m.name.split(':')[0]);
    const hasModel = names.some((n) => n === model || n.startsWith(`${model}:`));

    if (!hasModel) {
      return {
        ok: false,
        model,
        baseUrl,
        error: `Modèle "${model}" absent — lancez: ollama pull ${model}`,
      };
    }

    return { ok: true, model, baseUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[ollama] health check failed:', message);
    return { ok: false, model, baseUrl, error: message };
  }
}
