"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/providers/locale-provider";

export default function Loading() {
  const { messages } = useLocale();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center relative max-w-md mx-auto px-6">
        
        {/* Logo principal avec animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="relative">
            {/* Logo MoonSkin */}
            <div className="relative bg-cta-gradient-br rounded-2xl p-6 shadow-2xl">
              <div className="text-white font-bold text-3xl tracking-wider">
                Moon<span className="text-yellow-300">Skin</span>
              </div>
              
              {/* Effet de brillance */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />
            </div>

            {/* Particules flottantes */}
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
                  scale: [0.5, 1, 0.5]
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

        {/* Animation CS Style - Crosshair rotatif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 relative"
        >
          <div className="w-20 h-20 mx-auto relative">
            {/* Crosshair principal */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {/* Lignes du crosshair */}
              <div className="absolute w-8 h-0.5 bg-primary rounded-full" />
              <div className="absolute w-0.5 h-8 bg-primary rounded-full" />
              
              {/* Points aux extrémités */}
              <div className="absolute w-1 h-1 bg-primary rounded-full" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }} />
              <div className="absolute w-1 h-1 bg-primary rounded-full" style={{ bottom: '20%', left: '50%', transform: 'translateX(-50%)' }} />
              <div className="absolute w-1 h-1 bg-primary rounded-full" style={{ left: '20%', top: '50%', transform: 'translateY(-50%)' }} />
              <div className="absolute w-1 h-1 bg-primary rounded-full" style={{ right: '20%', top: '50%', transform: 'translateY(-50%)' }} />
            </motion.div>

            {/* Cercle extérieur */}
            <motion.div
              className="absolute inset-0 border-2 border-theme-accent/30 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            {/* Point central */}
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </motion.div>

        {/* Texte de chargement */}
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
            {messages.loading.title}
          </motion.h2>
          <p className="text-muted-foreground text-sm">
            {messages.loading.subtitle}
          </p>
        </motion.div>

        {/* Barre de progression moderne */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-full max-w-xs mx-auto"
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-cta-gradient rounded-full relative"
              animate={{ 
                width: ["0%", "100%", "0%"]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Effet de brillance sur la barre */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Indicateurs de statut */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex justify-center space-x-6 text-sm text-muted-foreground"
        >
          {[
            { label: messages.loading.steam, delay: 0 },
            { label: messages.loading.inventory, delay: 0.5 },
            { label: messages.loading.skins, delay: 1 }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center space-x-2"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: item.delay
              }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Animation de fond subtile */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
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
                opacity: [0.1, 0.3, 0.1]
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
