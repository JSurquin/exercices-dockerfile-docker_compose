"use client";

import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { homeReveal, homeStagger } from "@/lib/home-animation-classes";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { SectionBottomFade } from "@/components/home/section-bottom-fade";
import {
  HowItWorksCs2Step,
  HowItWorksTradeArrow,
} from "@/components/home/how-it-works-cs2-step";

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
      locked: true,
    },
    {
      step: 5,
      icon: BanknotesIcon,
      title: messages.howItWorks.steps.payment.title,
      description: messages.howItWorks.steps.payment.description,
      details: messages.howItWorks.steps.payment.details,
    },
  ];

  return (
    <section id="how-it-works" className="home-section-defer relative overflow-hidden py-16 sm:py-20 lg:py-24 bg-muted/30">
      <SectionBottomFade to="background" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`mb-16 text-center ${homeReveal.upSm}`}>
          <h2 className="mb-4 text-3xl font-bold uppercase tracking-wide md:text-4xl">
            {messages.howItWorks.titleLead}
            <span className="text-chrome-gradient">{messages.howItWorks.titleHighlight}</span>
          </h2>
          <p className="mx-auto mb-4 max-w-2xl text-3xl font-bold text-muted-foreground md:text-4xl">
            {messages.howItWorks.subtitle}
          </p>
        </div>

        <div
          className={cn(
            "mb-10 flex flex-wrap items-stretch justify-center gap-4 lg:mb-12",
            "xl:flex-nowrap xl:gap-x-2 xl:gap-y-0 2xl:gap-x-3",
          )}
        >
          {steps.map((step, index) => (
            <Fragment key={step.step}>
              <div
                className={cn(
                  "w-full sm:max-w-[16.5rem] xl:w-[13rem] xl:max-w-[13rem] 2xl:w-[14.5rem] 2xl:max-w-[14.5rem]",
                  homeReveal.up,
                  homeStagger(index),
                )}
              >
                <HowItWorksCs2Step
                  {...step}
                  lockedLabel={step.locked ? messages.howItWorks.tradeHoldLock : undefined}
                />
              </div>
              {index < steps.length - 1 && (
                <HowItWorksTradeArrow className="hidden self-center xl:flex xl:px-0.5 2xl:px-1" />
              )}
            </Fragment>
          ))}
        </div>

        <div className={`text-center ${homeReveal.upSm}`}>
          <h3 className="mb-2 text-xl font-bold sm:text-2xl">{messages.howItWorks.cta.title}</h3>
          <p className="mx-auto mb-6 max-w-lg text-muted-foreground sm:text-base">
            {messages.howItWorks.cta.description}
          </p>
          <Button size="lg" variant="cta" onClick={handlePrimaryCta} className="min-w-[200px]">
            {messages.howItWorks.cta.primary}
          </Button>
        </div>
      </div>
    </section>
  );
}
