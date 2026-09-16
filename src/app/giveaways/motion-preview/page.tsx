import type { Metadata } from 'next';
import { GiveawayMotionPreview } from '@/components/giveaway/giveaway-motion-preview';

export const metadata: Metadata = {
  title: 'Giveaway motion preview',
  robots: { index: false, follow: false },
};

export default function GiveawayMotionPreviewPage() {
  return <GiveawayMotionPreview />;
}
