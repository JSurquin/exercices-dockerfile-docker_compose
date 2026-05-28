import { logger } from '@/lib/logger';

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';
const BASE_URL = (process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, '');

/**
 * Génère un embedding 768-dim via Ollama nomic-embed-text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama embeddings HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { embedding?: number[] };

  if (!data.embedding || data.embedding.length === 0) {
    throw new Error('Embedding Ollama vide');
  }

  return data.embedding;
}

/**
 * Génère les embeddings pour une liste de textes (en séquentiel pour ne pas saturer Ollama).
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    try {
      results.push(await generateEmbedding(text));
    } catch (err) {
      logger.error('[embed] Erreur embedding:', err);
      throw err;
    }
  }
  return results;
}
