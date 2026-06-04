import { Metadata } from 'next';
import '../admin/admin-panel.css';
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
    <div className="admin-shell dark min-h-screen bg-gradient-to-br from-[#060608] via-[#0d0d12] to-[#060608] text-foreground">
      <ModerationHeader />
      <main>{children}</main>
    </div>
  );
}
