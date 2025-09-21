'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur pour le monitoring
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-4">
              Oops ! Quelque chose s'est mal passé
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Une erreur inattendue s'est produite. Ne vous inquiétez pas, nos équipes ont été automatiquement notifiées 
              et travaillent déjà sur une solution.
            </p>
          </motion.div>

          {/* Error Details (en mode développement) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Détails de l'erreur (mode développement)
                  </h3>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto bg-red-100 dark:bg-red-900/20 p-2 rounded">
                    {error.message}
                  </pre>
                  {error.digest && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={reset}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                  Contacter le support
                </Link>
              </Button>
            </div>

            {/* Quick Tips */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Quelques suggestions :</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Actualisez la page (F5 ou Ctrl+R)</li>
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Essayez de vider le cache de votre navigateur</li>
                  <li>• Si le problème persiste, contactez notre support</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12"
          >
            <p className="text-sm text-muted-foreground">
              Vérifiez le statut de nos services sur{' '}
              <a 
                href="https://status.cashtrade.gg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                status.cashtrade.gg
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
