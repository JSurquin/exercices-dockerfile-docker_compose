"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  CS2Background,
  AK47Icon,
  AWPIcon,
  SecurityShieldIcon,
  WeaponGradeIndicator,
} from "@/components/ui/cs2-icons";
import {
  CS2HeroBackground,
  usePreloadCS2Backgrounds,
} from "@/components/ui/cs2-header-background";
import {
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";


export function HeroSection() {
  const { messages } = useLocale();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Précharger les vraies images CS2
  usePreloadCS2Backgrounds();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Données traduites
  const stats = [
    { value: 15420, label: messages.hero.stats.users, prefix: "", suffix: "+" },
    { value: 2.4, label: messages.hero.stats.volume, prefix: "€", suffix: "M+" },
    { value: 8967, label: messages.hero.stats.trades, prefix: "", suffix: "+" },
    { value: 99.8, label: messages.hero.stats.satisfaction, prefix: "", suffix: "%" },
  ];

  const features = [
    {
      icon: ClockIcon,
      title: messages.hero.features.instant,
      description: messages.hero.features.instantDesc,
    },
    {
      icon: ShieldCheckIcon,
      title: messages.hero.features.secure,
      description: messages.hero.features.secureDesc,
    },
    {
      icon: CurrencyDollarIcon,
      title: messages.hero.features.transparent,
      description: messages.hero.features.transparentDesc,
    },
  ];

  const testimonials = [
    {
      name: messages.hero.testimonials.name[0],
      rating: 5,
      comment: messages.hero.testimonials.comment[0],
      amount: messages.hero.testimonials.amount[0],
    },
    {
      name: messages.hero.testimonials.name[1],
      rating: 5,
      comment: messages.hero.testimonials.comment[1],
      amount: messages.hero.testimonials.amount[1],
    },
    {
      name: messages.hero.testimonials.name[2],
      rating: 5,
      comment: messages.hero.testimonials.comment[2],
      amount: messages.hero.testimonials.amount[2],
    },
  ];

  return (
    <CS2HeroBackground className="relative overflow-hidden">
      {/* CS2 Background Pattern Overlay pour plus de texture */}
      <CS2Background className="opacity-20" />

      {/* Animated CS2 Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-10 text-orange-500/10"
        >
          <AK47Icon className="h-12 w-12" />
        </motion.div>

        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5,
          }}
          className="absolute top-40 right-20 text-orange-500/10"
        >
          <AWPIcon className="h-8 w-8" />
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-1/4 text-orange-500"
        >
          <SecurityShieldIcon className="h-16 w-16" />
        </motion.div>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500" />
                {messages.hero.badge}
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-3 sm:space-y-4"
            >
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white text-gaming-title leading-tight">
                {messages.hero.title.split("CS2")[0]}
                <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  CS2
                </span>
                {messages.hero.title.split("CS2")[1] || ""}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gaming-body text-muted-foreground text-white dark:text-gray-300 max-w-lg">
                {messages.hero.subtitle}
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1.5 sm:space-x-2"
                >
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gaming-caption">
                    {feature.title}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full"
            >
              <Button
                asChild
                className="w-full sm:w-auto h-12 sm:h-11 px-6 sm:px-8 text-sm sm:text-base bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <Link href={user ? "/sell" : "/login"}>
                  {user ? messages.hero.cta : messages.hero.cta}
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto h-12 sm:h-11 px-6 sm:px-8 text-sm sm:text-base"
              >
                <Link href="#how-it-works">{messages.hero.secondaryCta}</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6 sm:pt-8 border-t"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-orange-600">
                    {stat.prefix}
                    <CountUp
                      end={stat.value}
                      duration={2}
                      delay={0.5}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                    {stat.suffix}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative bg-card rounded-2xl border p-4 sm:p-6 lg:p-8 shadow-2xl">
              {/* Fake Trade Interface */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {messages.trade.estimation}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-green-600 text-xs sm:text-sm"
                  >
                    {messages.common.online}
                  </Badge>
                </div>

                {/* Skin Items */}
                <div className="space-y-2 sm:space-y-3">
                  <motion.div
                    className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                      <AK47Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      <WeaponGradeIndicator
                        grade="Classified"
                        className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          AK-47 | Redline
                        </p>
                        <div className="px-1.5 sm:px-2 py-0.5 bg-orange-500/20 text-orange-600 text-xs rounded font-mono flex-shrink-0">
                          StatTrak™
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-1">
                        <span>Field-Tested</span>
                        <span className="text-yellow-500">★★★</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-lg text-green-600">
                        127.50€
                      </p>
                      <p className="text-xs text-muted-foreground">+15% ↗</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <AWPIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      <WeaponGradeIndicator
                        grade="Covert"
                        className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          AWP | Dragon Lore
                        </p>
                        <div className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs rounded flex-shrink-0">
                          ★
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-1">
                        <span>Factory New</span>
                        <span className="text-green-500">★★★★★</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-lg text-green-600">
                        2,847.00€
                      </p>
                      <p className="text-xs text-green-500">+8% ↗</p>
                    </div>
                  </motion.div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-2 bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span>{messages.hero.tradeInterface.totalBrut}</span>
                    <span className="font-medium">2,974.50€</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{messages.hero.tradeInterface.cashoutFees}</span>
                    <span>-14.87€</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{messages.hero.tradeInterface.sepafees}</span>
                    <span>-2.50€</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-green-600">
                    <span>{messages.hero.tradeInterface.totalNet}</span>
                    <span className="bg-green-500/10 px-2 py-1 rounded">
                      2,957.13€
                    </span>
                  </div>
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    💡 {messages.trade.automaticPayment}
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  {messages.trade.confirm}
                </Button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Testimonial Cards */}
            <div className="absolute -bottom-6 -left-6 w-72 bg-card rounded-xl border p-4 shadow-lg hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">PG</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium">{testimonials[0].name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonials[0].comment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    {testimonials[0].amount}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </CS2HeroBackground>
  );
}
