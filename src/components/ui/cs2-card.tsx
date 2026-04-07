import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getRarityHexColor } from "@/lib/cs2-constants";

interface CS2CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gaming" | "weapon" | "trading";
  hover?: boolean;
  glow?: boolean;
}

export const CS2Card: React.FC<CS2CardProps> = ({
  children,
  className,
  variant = "default",
  hover = true,
  glow = false,
}) => {
  const getVariantClasses = (variant: string) => {
    const variants = {
      default: "bg-card border-border",
      gaming:
        "bg-gradient-to-br from-orange-500/5 via-card to-red-500/5 border-orange-500/20",
      weapon:
        "bg-gradient-to-br from-yellow-500/10 via-card to-orange-500/10 border-yellow-500/30",
      trading:
        "bg-gradient-to-br from-green-500/10 via-card to-blue-500/10 border-green-500/30",
    };
    return variants[variant as keyof typeof variants] || variants.default;
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "hover:shadow-xl",
          glow && "shadow-2xl shadow-orange-500/20",
          getVariantClasses(variant),
          className
        )}
      >
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-red-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}
        {children}
      </Card>
    </motion.div>
  );
};

interface CS2WeaponCardProps {
  weapon: {
    name: string;
    skin: string;
    condition: string;
    rarity: string;
    price: number;
    change: number;
    statTrak?: boolean;
    image?: string;
  };
  className?: string;
}

export const CS2WeaponCard: React.FC<CS2WeaponCardProps> = ({
  weapon,
  className,
}) => {
  const getRarityColor = (rarity: string) => {
    const normalized = getRarityHexColor(rarity);
    const gradients: Record<string, string> = {
      '#b0c3d9': 'from-gray-500 to-gray-600',
      '#5e98d9': 'from-blue-500 to-blue-600',
      '#4b69ff': 'from-indigo-500 to-indigo-600',
      '#8847ff': 'from-purple-500 to-purple-600',
      '#d32ce6': 'from-pink-500 to-pink-600',
      '#eb4b4b': 'from-red-500 to-red-600',
      '#ffd700': 'from-yellow-500 to-orange-500',
    };
    return gradients[normalized] || 'from-gray-500 to-gray-600';
  };

  const getConditionStars = (condition: string) => {
    const stars = {
      "Battle-Scarred": 1,
      "Well-Worn": 2,
      "Field-Tested": 3,
      "Minimal Wear": 4,
      "Factory New": 5,
    };
    return stars[condition as keyof typeof stars] || 3;
  };

  return (
    <CS2Card
      variant="weapon"
      hover={true}
      glow={true}
      className={cn("p-0", className)}
    >
      <div
        className={`h-1 bg-gradient-to-r ${getRarityColor(weapon.rarity)}`}
      />

      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {/* Weapon Image/Icon placeholder */}
          <div
            className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getRarityColor(
              weapon.rarity
            )} flex items-center justify-center shadow-lg relative`}
          >
            {weapon.image ? (
              <img
                src={weapon.image}
                alt={weapon.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {weapon.name.split(" ")[0]}
              </span>
            )}

            {/* Rarity indicator */}
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r ${getRarityColor(
                weapon.rarity
              )} border-2 border-background`}
            />
          </div>

          <div className="flex-1">
            {/* Weapon name and StatTrak */}
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-sm">
                {weapon.name} | {weapon.skin}
              </h3>
              {weapon.statTrak && (
                <div className="px-2 py-0.5 bg-orange-500/20 text-orange-600 text-xs rounded font-mono">
                  StatTrak™
                </div>
              )}
            </div>

            {/* Condition and stars */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-muted-foreground">
                {weapon.condition}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < getConditionStars(weapon.condition)
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Price and change */}
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">
                  €{weapon.price.toFixed(2)}
                </p>
                <p
                  className={`text-xs ${
                    weapon.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {weapon.change >= 0 ? "+" : ""}
                  {weapon.change}% {weapon.change >= 0 ? "↗" : "↘"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </CS2Card>
  );
};
