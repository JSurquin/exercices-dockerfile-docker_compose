import React from 'react';

interface PaymentIconProps {
  className?: string;
}

export const StripeIcon: React.FC<PaymentIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"
      fill="#6772E5"
    />
  </svg>
);

export const QontoIcon: React.FC<PaymentIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FF6B35"/>
    <path
      d="M6 8h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z"
      fill="white"
    />
    <circle cx="16" cy="16" r="2" fill="white"/>
  </svg>
);

export const BinanceIcon: React.FC<PaymentIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L8.09 5.91L12 9.82L15.91 5.91L12 2ZM2 12L5.91 8.09L9.82 12L5.91 15.91L2 12ZM12 14.18L8.09 18.09L12 22L15.91 18.09L12 14.18ZM14.18 12L18.09 8.09L22 12L18.09 15.91L14.18 12Z"
      fill="#F3BA2F"
    />
    <path
      d="M12 7.27L10.18 9.09L12 10.91L13.82 9.09L12 7.27ZM7.27 12L9.09 10.18L10.91 12L9.09 13.82L7.27 12ZM12 13.09L10.18 14.91L12 16.73L13.82 14.91L12 13.09ZM13.09 12L14.91 10.18L16.73 12L14.91 13.82L13.09 12Z"
      fill="#F3BA2F"
    />
  </svg>
);
