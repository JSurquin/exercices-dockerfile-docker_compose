import { isOllamaConfigured } from '@/lib/ollama';

export function shouldAiReplyToConversation(input: {
  assignedTo: string | null;
  status: string;
  hasModeratorMessage: boolean;
}): boolean {
  if (!isOllamaConfigured()) return false;
  if (input.status === 'CLOSED' || input.status === 'ARCHIVED') return false;
  if (input.assignedTo) return false;
  if (input.hasModeratorMessage) return false;
  return true;
}
