"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardTilt } from "@/components/ui/card-tilt";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import {
  homeReveal,
  homeStagger,
} from "@/lib/home-animation-classes";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { SectionBottomFade } from "@/components/home/section-bottom-fade";

export function HowItWorks() {
  const { messages } = useLocale();
  const { user, loginWithSteam } = useAuth();
  const router = useRouter();

  const handlePrimaryCta = () => {
    if (user) {
      router.push("/sell");
      return;
    }
    void loginWithSteam();
  };

  const steps = [
    {
      step: 1,
      icon: LinkIcon,
      title: messages.howItWorks.steps.addTradeLink.title,
      description: messages.howItWorks.steps.addTradeLink.description,
      details: messages.howItWorks.steps.addTradeLink.details,
    },
    {
      step: 2,
      icon: CurrencyDollarIcon,
      title: messages.howItWorks.steps.estimation.title,
      description: messages.howItWorks.steps.estimation.description,
      details: messages.howItWorks.steps.estimation.details,
    },
    {
      step: 3,
      icon: ShieldCheckIcon,
      title: messages.howItWorks.steps.kyc.title,
      description: messages.howItWorks.steps.kyc.description,
      details: messages.howItWorks.steps.kyc.details,
    },
    {
      step: 4,
      icon: ClockIcon,
      title: messages.howItWorks.steps.tradeHold.title,
      description: messages.howItWorks.steps.tradeHold.description,
      details: messages.howItWorks.steps.tradeHold.details,
    },
    {
      step: 5,
      icon: BanknotesIcon,
      title: messages.howItWorks.steps.payment.title,
      description: messages.howItWorks.steps.payment.description,
      details: messages.howItWorks.steps.payment.details,
    },
  ];

  const benefits = [
    {
      icon: CheckCircleIcon,
      title: messages.howItWorks.benefits.automated.title,
      description: messages.howItWorks.benefits.automated.description,
    },
    {
      icon: ShieldCheckIcon,
      title: messages.howItWorks.benefits.security.title,
      description: messages.howItWorks.benefits.security.description,
    },
    {
      icon: CurrencyDollarIcon,
      title: messages.howItWorks.benefits.transparent.title,
      description: messages.howItWorks.benefits.transparent.description,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 bg-muted/30">
      <SectionBottomFade to="background" />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Glass Effect */}
        <div className={`text-center mb-16 ${homeReveal.upSm}`}>
          <div className="lunar-card p-6 sm:p-8 inline-block">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              {messages.howItWorks.title}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {messages.howItWorks.subtitle}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`relative ${homeReveal.up} ${homeStagger(index)}`}
            >
              <Card className="lunar-card h-full weapon-card-hover">
                <CardContent className="p-6 text-center">
                  {/* Step Number */}
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[var(--cta-from)] to-[var(--cta-to)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--cta-shadow)]">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <step.icon className="w-8 h-8 mx-auto text-theme-accent" />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center justify-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-theme-accent/80 to-theme-accent relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-theme-accent border-t-2 border-b-2 border-t-transparent border-b-transparent" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className={`grid md:grid-cols-3 gap-6 lg:gap-8 mb-12 ${homeReveal.upSm}`}>
          {benefits.map((benefit, index) => (
            <CardTilt
              key={index}
              shimmer
              className={`h-full weapon-card-hover ${homeReveal.up} ${homeStagger(index)}`}
            >
              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="how-it-works-benefit-icon flex h-14 w-14 items-center justify-center rounded-full border border-theme-accent/30 bg-gradient-to-br from-white/10 to-theme-accent/10 ring-2 ring-theme-accent/15">
                    <benefit.icon className="w-8 h-8 text-theme-accent" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            </CardTilt>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center ${homeReveal.upSm}`}>
          <div className="backdrop-blur-md bg-background/60 rounded-2xl p-8 border border-white/10 dark:border-white/10">
            <h3 className="text-2xl font-bold mb-4">{messages.howItWorks.cta.title}</h3>
            <p className="text-muted-foreground mb-6">
              {messages.howItWorks.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="cta"
                onClick={handlePrimaryCta}
              >
                {messages.howItWorks.cta.primary}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
