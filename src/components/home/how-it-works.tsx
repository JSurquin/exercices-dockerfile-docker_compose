"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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

function getGlowLevel(hovered: number | null, index: number): number {
  if (hovered === null) return 0;
  const dist = Math.abs(index - hovered);
  if (dist === 0) return 3;
  if (dist === 1) return 2;
  if (dist <= 3) return 1;
  if (hovered <= 4 && index >= 5) return 1;
  if (hovered >= 5 && index <= 4) return 1;
  return 0;
}

function getConnectorGlow(hovered: number | null, connectorIndex: number): number {
  if (hovered === null) return 0;
  if (hovered >= 5) return 1;
  const distToLeft = Math.abs(connectorIndex - hovered);
  const distToRight = Math.abs(connectorIndex + 1 - hovered);
  const dist = Math.min(distToLeft, distToRight);
  if (dist === 0) return 3;
  if (dist === 1) return 2;
  if (dist <= 2) return 1;
  return 0;
}

function glowClass(level: number): string {
  if (level >= 3) return "how-it-works-glow-active";
  if (level >= 2) return "how-it-works-glow-near";
  if (level >= 1) return "how-it-works-glow-far";
  return "";
}

function connectorGlowClass(level: number): string {
  if (level >= 3) return "how-it-works-connector-glow-active";
  if (level >= 2) return "how-it-works-connector-glow-near";
  if (level >= 1) return "how-it-works-connector-glow-far";
  return "";
}

function ProcessConnector({
  orientation,
  glowLevel,
}: {
  orientation: "horizontal" | "vertical";
  glowLevel: number;
}) {
  return (
    <div
      className={cn(
        "how-it-works-connector flex-shrink-0",
        orientation === "horizontal"
          ? "how-it-works-connector-h hidden lg:flex"
          : "how-it-works-connector-v flex lg:hidden",
        connectorGlowClass(glowLevel)
      )}
      aria-hidden
    >
      <div className="how-it-works-connector-line" />
    </div>
  );
}

export function HowItWorks() {
  const { messages } = useLocale();
  const { user, loginWithSteam } = useAuth();
  const router = useRouter();
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

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
      <div
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8"
        onMouseLeave={() => setHoveredZone(null)}
      >
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

        {/* Steps with connecting lines */}
        <div className="how-it-works-steps mb-12 lg:mb-16 flex flex-col lg:flex-row lg:flex-nowrap lg:items-stretch">
          {steps.map((step, index) => (
            <div key={step.step} className="contents">
              <div
                className={cn(
                  "flex-1 min-w-0",
                  homeReveal.up,
                  homeStagger(index)
                )}
                onMouseEnter={() => setHoveredZone(index)}
              >
                <Card
                  className={cn(
                    "lunar-card h-full weapon-card-hover how-it-works-step-card",
                    glowClass(getGlowLevel(hoveredZone, index))
                  )}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[var(--cta-from)] to-[var(--cta-to)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--cta-shadow)]">
                        <span className="text-white font-bold">{step.step}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <step.icon className="w-8 h-8 mx-auto text-theme-accent" />
                    </div>

                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {step.description}
                    </p>

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
              </div>

              {index < steps.length - 1 && (
                <>
                  <ProcessConnector
                    orientation="vertical"
                    glowLevel={getConnectorGlow(hoveredZone, index)}
                  />
                  <ProcessConnector
                    orientation="horizontal"
                    glowLevel={getConnectorGlow(hoveredZone, index)}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Benefits, glass cards with propagated hover */}
        <div className={`grid md:grid-cols-3 gap-6 lg:gap-8 mb-12 ${homeReveal.upSm}`}>
          {benefits.map((benefit, index) => {
            const zoneIndex = steps.length + index;
            return (
              <div
                key={index}
                className={cn(homeReveal.up, homeStagger(index))}
                onMouseEnter={() => setHoveredZone(zoneIndex)}
              >
                <Card
                  className={cn(
                    "lunar-card h-full weapon-card-hover how-it-works-benefit-card chrome-shimmer",
                    glowClass(getGlowLevel(hoveredZone, zoneIndex))
                  )}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="how-it-works-benefit-icon flex h-14 w-14 items-center justify-center rounded-full border border-theme-accent/30 bg-gradient-to-br from-white/10 to-theme-accent/10 ring-2 ring-theme-accent/15">
                        <benefit.icon className="w-8 h-8 text-theme-accent" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className={`text-center ${homeReveal.upSm}`}>
          <div className="lunar-card how-it-works-cta-card p-8">
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
