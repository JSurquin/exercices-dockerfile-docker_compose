"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";

export default function NotFound() {
  const { messages } = useLocale();
  const t = messages.notFound;
  const randomCount = Math.floor(Math.random() * 5) + 1;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Error Code */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold bg-cta-gradient bg-clip-text text-transparent">
              404
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-muted-foreground mt-2">
              {t.pageNotFound}
            </div>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-theme-accent" />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold mb-4">
              {t.title}
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t.description}
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="bg-cta-gradient hover:brightness-110"
              >
                <Link href="/">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  {t.backHome}
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                {t.previousPage}
              </Button>
            </div>

            {/* Quick Links */}
            <Card className="mt-8">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  {t.usefulLinks}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Link
                    href="/sell"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.sellSkins}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.myDashboard}
                  </Link>
                  <Link
                    href="/giveaways"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.giveaways}
                  </Link>
                  <Link
                    href="/help"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.support}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Fun Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t.randomStats.replace('{count}', randomCount.toString())}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
