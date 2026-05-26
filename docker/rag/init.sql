-- Base RAG MoonSkin (séparée de Prisma — ne pas migrer via schema.prisma)
CREATE EXTENSION IF NOT EXISTS vector;

-- Schéma minimal pour le futur chatbot RAG (embeddings Ollama nomic-embed-text = 768 dims)
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_documents_source_idx ON rag_documents (source);
CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
  ON rag_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
