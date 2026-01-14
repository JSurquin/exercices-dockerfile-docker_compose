import { Metadata } from 'next';

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
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
