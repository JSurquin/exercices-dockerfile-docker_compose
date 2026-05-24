import { Metadata } from 'next';
import { ModerationHeader } from '@/components/moderation/moderation-header';

export const metadata: Metadata = {
  title: 'Modération - MoonSkin',
  description: 'Interface de modération pour gérer les conversations utilisateurs',
};

export default function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <ModerationHeader />
      <main>{children}</main>
    </div>
  );
}
