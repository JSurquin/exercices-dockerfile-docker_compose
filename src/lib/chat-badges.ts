/** Classes Tailwind partagées pour les badges chat (admin + modération). */

export function chatStatusBadgeClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'CLOSED') return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
}

export function chatPriorityBadgeClass(priority: string): string {
  if (priority === 'URGENT') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (priority === 'HIGH') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (priority === 'NORMAL') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function chatSenderBadgeClass(senderType: string): string {
  if (senderType === 'USER') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (senderType === 'BOT') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (senderType === 'AI') return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
  if (senderType === 'MODERATOR') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}
