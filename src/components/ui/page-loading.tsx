'use client';

import { motion } from 'framer-motion';
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  /** full = écran route (logo + crosshair + barre) ; compact = zones inline */
  variant?: 'full' | 'compact';
  message?: string;
  className?: string;
};

function CrosshairLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box =
    size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
  const line =
    size === 'sm' ? 'w-5 h-0.5' : size === 'lg' ? 'w-10 h-0.5' : 'w-8 h-0.5';
  const lineV =
    size === 'sm' ? 'w-0.5 h-5' : size === 'lg' ? 'w-0.5 h-10' : 'w-0.5 h-8';

  return (
    <div className={cn('mx-auto relative', box)}>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div className={cn('absolute bg-theme-accent rounded-full', line)} />
        <div className={cn('absolute bg-theme-accent rounded-full', lineV)} />
        <div
          className="absolute w-1 h-1 bg-theme-highlight rounded-full"
          style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}
        />
        <div
          className="absolute w-1 h-1 bg-theme-highlight rounded-full"
          style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}
        />
        <div
          className="absolute w-1 h-1 bg-theme-highlight rounded-full"
          style={{ left: '20%', top: '50%', transform: 'translateY(-50%)' }}
        />
        <div
          className="absolute w-1 h-1 bg-theme-highlight rounded-full"
          style={{ right: '20%', top: '50%', transform: 'translateY(-50%)' }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 border-2 border-theme-accent/30 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-theme-highlight rounded-full -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

function ProgressBar({ className }: { className?: string }) {
  return (
    <div className={cn('w-full max-w-xs mx-auto', className)}>
      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-cta-gradient rounded-full relative"
          animate={{ width: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export function PageLoading({ variant = 'full', message, className }: PageLoadingProps) {
  const { messages } = useLocale();
  const title = message ?? messages.loading.title;
  const subtitle = messages.loading.subtitle;

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 py-8', className)}>
        <CrosshairLoader size="sm" />
        <motion.p
          className="text-sm font-medium text-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {title}
        </motion.p>
        <ProgressBar className="max-w-[200px]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-background',
        className
      )}
    >
      <div className="text-center relative max-w-md mx-auto px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="relative">
            <div className="relative bg-cta-gradient-br rounded-2xl p-6 shadow-2xl">
              <div className="text-white font-bold text-3xl tracking-wider">
                Moon<span className="text-yellow-300">Skin</span>
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
              />
            </div>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-theme-highlight rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 80}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <CrosshairLoader />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <motion.h2
            className="text-xl font-semibold mb-2 text-foreground"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {title}
          </motion.h2>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <ProgressBar />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          {[
            { label: messages.loading.steam, delay: 0 },
            { label: messages.loading.inventory, delay: 0.5 },
            { label: messages.loading.skins, delay: 1 },
          ].map((item) => (
            <motion.div
              key={item.label}
              className="flex items-center space-x-2"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: item.delay }}
            >
              <div className="w-2 h-2 bg-theme-accent/80 rounded-full" />
              <span>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 border border-theme-accent/10 rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 1.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
