import { HeroSection } from '@/components/home/hero-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { LevelsSection } from '@/components/home/levels-section';
import { FeaturesSection } from '@/components/home/features-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { PartnersSection } from '@/components/home/partners-section';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <HeroSection />
      <HowItWorks />
      <LevelsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PartnersSection />
    </div>
  );
}
