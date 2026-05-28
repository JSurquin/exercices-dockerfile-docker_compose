import { Pool } from 'pg';

let _pool: Pool | null = null;

export function getRagPool(): Pool {
  if (!_pool) {
    const url = process.env.RAG_DATABASE_URL;
    if (!url) throw new Error('RAG_DATABASE_URL non défini');
    _pool = new Pool({ connectionString: url, max: 5 });
  }
  return _pool;
}

export interface RagDocument {
  id: string;
  source: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Recherche les N chunks les plus proches (cosine similarity) du vecteur query.
 * Retourne les chunks triés du plus pertinent au moins pertinent.
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK = 4,
  minScore = 0.5,
): Promise<RagDocument[]> {
  const pool = getRagPool();
  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  const { rows } = await pool.query<{
    id: string;
    source: string;
    chunk_index: number;
    content: string;
    metadata: Record<string, unknown>;
    score: number;
  }>(
    `SELECT id, source, chunk_index, content, metadata,
            1 - (embedding <=> $1::vector) AS score
     FROM rag_documents
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorLiteral, topK],
  );

  return rows
    .filter((r) => r.score >= minScore)
    .map((r) => ({
      id: r.id,
      source: r.source,
      chunkIndex: r.chunk_index,
      content: r.content,
      metadata: r.metadata,
    }));
}

/**
 * Insère un document avec son embedding.
 */
export async function insertRagDocument(doc: {
  source: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const pool = getRagPool();
  const vectorLiteral = `[${doc.embedding.join(',')}]`;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO rag_documents (source, chunk_index, content, embedding, metadata)
     VALUES ($1, $2, $3, $4::vector, $5)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      doc.source,
      doc.chunkIndex,
      doc.content,
      vectorLiteral,
      JSON.stringify(doc.metadata ?? {}),
    ],
  );

  return rows[0]?.id ?? '';
}
