import { HeroSection } from '@/components/home/hero-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { LevelsSection } from '@/components/home/levels-section';
import { FeaturesSection } from '@/components/home/features-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { PartnersSection } from '@/components/home/partners-section';
import { EMPTY_PUBLIC_STATS, getServerPublicStats } from '@/lib/get-public-stats';
import {
  DEFAULT_PLATFORM_SETTINGS,
  getServerPlatformSettings,
} from '@/lib/get-platform-settings';
import {
  EMPTY_PUBLIC_PARTNERS,
  getServerPublicPartners,
} from '@/lib/get-public-partners';

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
