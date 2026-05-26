import { NextResponse } from 'next/server';
import { checkOllamaHealth, isOllamaConfigured } from '@/lib/ollama';

/** GET /api/chat/ai/health — vérifie qu'Ollama est joignable et que le modèle est présent */
export async function GET() {
  if (!isOllamaConfigured()) {
    return NextResponse.json({
      enabled: false,
      ok: false,
      message: 'CHAT_AI_ENABLED n\'est pas activé',
    });
  }

  const health = await checkOllamaHealth();

  return NextResponse.json({
    enabled: true,
    ok: health.ok,
    model: health.model,
    baseUrl: health.baseUrl,
    error: health.error,
  });
}
