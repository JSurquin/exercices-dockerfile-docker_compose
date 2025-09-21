import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CS2ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
  isLoading?: boolean;
}

export const CS2Button: React.FC<CS2ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  isLoading,
  ...props
}) => {
  const getVariantClasses = (variant: string) => {
    const variants = {
      primary: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border border-gray-500/30',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg',
      success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg',
    };
    return variants[variant as keyof typeof variants] || variants.primary;
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        className={cn(
          'relative overflow-hidden font-semibold transition-all duration-200 transform',
          'before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] before:transition-transform before:duration-300 hover:before:translate-x-[100%]',
          getVariantClasses(variant),
          getSizeClasses(size),
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Chargement...</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
};

export const CS2IconButton: React.FC<{
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({
  icon,
  label,
  // variant = 'primary', // Commented out as it's not used yet
  size = 'md',
  className,
  onClick,
  disabled
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-lg transition-all duration-200',
        'bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20',
        'border border-orange-500/20 hover:border-orange-500/40',
        'backdrop-blur-sm shadow-lg hover:shadow-xl',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-12 w-12',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="text-orange-500 group-hover:text-orange-400 transition-colors">
        {icon}
      </div>
      {label && (
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {label}
        </span>
      )}
    </motion.button>
  );
};
