import React from "react";
import { getRarityHexColor } from "@/lib/cs2-constants";

interface IconProps {
  className?: string;
  size?: number;
}

export const CS2Logo: React.FC<IconProps> = ({
  className = "h-6 w-6",
  size,
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    width={size}
    height={size}
    fill="currentColor"
  >
    <defs>
      <linearGradient id="cs2-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="50%" stopColor="#F7931E" />
        <stop offset="100%" stopColor="#FF6B35" />
      </linearGradient>
    </defs>
    <path
      d="M16 2L4 8v16l12 6 12-6V8L16 2zm8 20l-8 4-8-4V10l8-4 8 4v12z"
      fill="url(#cs2-gradient)"
    />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
    <path d="M16 11l-3 3h6l-3-3z" fill="currentColor" opacity="0.7" />
    <path d="M16 21l3-3h-6l3 3z" fill="currentColor" opacity="0.7" />
  </svg>
);

export const AK47Icon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M2 12h3v2H2v-2zm4-2h14v1H6v-1zm0 3h14v1H6v-1zm16-4h2v4h-2v-4zM4 8h16v1H4V8zm0 7h16v1H4v-1z" />
    <rect x="20" y="10" width="2" height="4" rx="1" />
    <circle cx="3" cy="13" r="1" />
  </svg>
);

export const AWPIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M2 11h20v2H2v-2z" />
    <circle cx="4" cy="12" r="1.5" />
    <rect x="6" y="11" width="12" height="2" />
    <path d="M18 10v4l3-1v-2l-3-1z" />
    <rect x="19" y="11.5" width="3" height="1" />
  </svg>
);

export const SkinIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <rect
      x="3"
      y="6"
      width="18"
      height="12"
      rx="2"
      fill="currentColor"
      opacity="0.2"
    />
    <path
      d="M5 8h14v8H5V8z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M8 11h8M8 13h6M8 15h4" stroke="currentColor" strokeWidth="1" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
  </svg>
);

export const TradingIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8 2l4 4-4 4V7H2V5h6V2z" />
    <path d="M16 22l-4-4 4-4v3h6v2h-6v3z" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path
      d="M12 8v8M8 12h8"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.5"
    />
  </svg>
);

export const SecurityShieldIcon: React.FC<IconProps> = ({
  className = "h-6 w-6",
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

export const CS2Background: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`cs2-deco-layer pointer-events-none select-none absolute inset-0 ${className}`} aria-hidden>
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id="cs2-pattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect width="20" height="20" fill="transparent" />
          <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.1" />
        </pattern>
        <linearGradient
          id="cs2-bg-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#F7931E" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#cs2-bg-gradient)" />
      <rect width="100%" height="100%" fill="url(#cs2-pattern)" />
    </svg>
  </div>
);

export const WeaponGradeIndicator: React.FC<{
  grade: string;
  className?: string;
}> = ({ grade, className = "h-4 w-4" }) => {
  const getGradeColor = (grade: string) => {
    return getRarityHexColor(grade);
  };

  return (
    <div
      className={`rounded-full ${className}`}
      style={{ backgroundColor: getGradeColor(grade) }}
    >
      <div
        className="w-full h-full rounded-full animate-pulse opacity-70"
        style={{ backgroundColor: getGradeColor(grade) }}
      ></div>
    </div>
  );
};

export const SteamIcon: React.FC<IconProps> = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
  </svg>
);

export const StatTrakIcon: React.FC<IconProps> = ({
  className = "h-4 w-4",
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <rect x="2" y="8" width="20" height="8" rx="2" fill="#FF6B35" />
    <rect x="4" y="10" width="16" height="4" rx="1" fill="#000" />
    <text
      x="12"
      y="14"
      textAnchor="middle"
      fill="#FF6B35"
      fontSize="6"
      fontFamily="monospace"
    >
      ST
    </text>
    <circle cx="6" cy="12" r="0.5" fill="#FF6B35" />
    <circle cx="18" cy="12" r="0.5" fill="#FF6B35" />
  </svg>
);
