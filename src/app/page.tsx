import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/home/hero-section';
import { EMPTY_PUBLIC_STATS, getServerPublicStats } from '@/lib/get-public-stats';
import {
  DEFAULT_PLATFORM_SETTINGS,
  getServerPlatformSettings,
} from '@/lib/get-platform-settings';
import {
  EMPTY_PUBLIC_PARTNERS,
  getServerPublicPartners,
} from '@/lib/get-public-partners';

const HowItWorks = dynamic(() =>
  import('@/components/home/how-it-works').then((mod) => ({ default: mod.HowItWorks })),
);
const LevelsSection = dynamic(() =>
  import('@/components/home/levels-section').then((mod) => ({ default: mod.LevelsSection })),
);
const FeaturesSection = dynamic(() =>
  import('@/components/home/features-section').then((mod) => ({ default: mod.FeaturesSection })),
);
const TestimonialsSection = dynamic(() =>
  import('@/components/home/testimonials-section').then((mod) => ({ default: mod.TestimonialsSection })),
);
const PartnersSection = dynamic(() =>
  import('@/components/home/partners-section').then((mod) => ({ default: mod.PartnersSection })),
);

export const revalidate = 300;

export default async function Home() {
  const [publicStats, platformSettings, partners] = await Promise.all([
    getServerPublicStats().catch(() => EMPTY_PUBLIC_STATS),
    getServerPlatformSettings().catch(() => DEFAULT_PLATFORM_SETTINGS),
    getServerPublicPartners().catch(() => EMPTY_PUBLIC_PARTNERS),
  ]);

  return (
    <div className="min-h-screen relative">
      <HeroSection publicStats={publicStats} platformSettings={platformSettings} />
      <HowItWorks />
      <LevelsSection />
      <FeaturesSection />
      <TestimonialsSection publicStats={publicStats} />
      <PartnersSection initialPartners={partners} />
    </div>
  );
}
