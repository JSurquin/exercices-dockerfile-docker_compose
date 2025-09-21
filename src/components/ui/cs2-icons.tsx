import React from "react";

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
  <div className={`absolute inset-0 ${className}`}>
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
          <path
            d="M5 5l10 10M15 5l-10 10"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.05"
          />
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
    const colors = {
      "Consumer Grade": "#B0C3D9",
      "Industrial Grade": "#5E98D9",
      "Mil-Spec": "#4B69FF",
      Restricted: "#8847FF",
      Classified: "#D32CE6",
      Covert: "#EB4B4B",
      Extraordinary: "#FFD700",
    };
    return colors[grade as keyof typeof colors] || "#B0C3D9";
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
