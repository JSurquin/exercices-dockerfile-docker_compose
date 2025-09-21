'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NotFound() {
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
            <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              404
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-muted-foreground mt-2">
              Page non trouvée
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
              <ExclamationTriangleIcon className="w-12 h-12 text-orange-500" />
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
              Oops ! Cette page semble avoir disparu
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              La page que vous recherchez n'existe pas ou a été déplacée. 
              Peut-être qu'elle s'est vendue sur CashTrade ? 😄
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                <Link href="/">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Page précédente
              </Button>
            </div>

            {/* Quick Links */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Liens utiles
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Link href="/sell" className="text-muted-foreground hover:text-foreground transition-colors">
                    Vendre mes skins
                  </Link>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Mon Dashboard
                  </Link>
                  <Link href="/giveaways" className="text-muted-foreground hover:text-foreground transition-colors">
                    Giveaways
                  </Link>
                  <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                    Support
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
              Pendant que vous étiez là, {Math.floor(Math.random() * 5) + 1} skins ont été vendus sur CashTrade !
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
