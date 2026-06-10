'use client';

import { SupportedCurrency } from '@/lib/currency-converter';
import { cn } from '@/lib/utils';

interface CurrencyFlagProps {
  currency: SupportedCurrency;
  className?: string;
}

export function CurrencyFlag({ currency, className }: CurrencyFlagProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10',
        className,
      )}
      aria-hidden
    >
      {currency === 'USD' && <UsFlag />}
      {currency === 'EUR' && <EuFlag />}
      {currency === 'CNY' && <CnFlag />}
    </span>
  );
}

function UsFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6" role="img">
      <rect width="24" height="16" fill="#B22234" />
      <path
        fill="#FFF"
        d="M0 1.23h24M0 3.69h24M0 6.15h24M0 8.62h24M0 11.08h24M0 13.54h24"
        stroke="#FFF"
        strokeWidth="1.23"
      />
      <rect width="9.6" height="8.62" fill="#3C3B6E" />
      <g fill="#FFF">
        <circle cx="1.6" cy="1.4" r="0.55" />
        <circle cx="3.2" cy="1.4" r="0.55" />
        <circle cx="4.8" cy="1.4" r="0.55" />
        <circle cx="6.4" cy="1.4" r="0.55" />
        <circle cx="8" cy="1.4" r="0.55" />
        <circle cx="2.4" cy="2.8" r="0.55" />
        <circle cx="4" cy="2.8" r="0.55" />
        <circle cx="5.6" cy="2.8" r="0.55" />
        <circle cx="7.2" cy="2.8" r="0.55" />
        <circle cx="1.6" cy="4.2" r="0.55" />
        <circle cx="3.2" cy="4.2" r="0.55" />
        <circle cx="4.8" cy="4.2" r="0.55" />
        <circle cx="6.4" cy="4.2" r="0.55" />
        <circle cx="8" cy="4.2" r="0.55" />
        <circle cx="2.4" cy="5.6" r="0.55" />
        <circle cx="4" cy="5.6" r="0.55" />
        <circle cx="5.6" cy="5.6" r="0.55" />
        <circle cx="7.2" cy="5.6" r="0.55" />
        <circle cx="1.6" cy="7" r="0.55" />
        <circle cx="3.2" cy="7" r="0.55" />
        <circle cx="4.8" cy="7" r="0.55" />
        <circle cx="6.4" cy="7" r="0.55" />
        <circle cx="8" cy="7" r="0.55" />
      </g>
    </svg>
  );
}

function EuFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6" role="img">
      <rect width="24" height="16" fill="#003399" />
      <g fill="#FFCC00">
        <circle cx="12" cy="3.2" r="0.75" />
        <circle cx="14.8" cy="3.8" r="0.75" />
        <circle cx="16.9" cy="5.6" r="0.75" />
        <circle cx="17.8" cy="8" r="0.75" />
        <circle cx="16.9" cy="10.4" r="0.75" />
        <circle cx="14.8" cy="12.2" r="0.75" />
        <circle cx="12" cy="12.8" r="0.75" />
        <circle cx="9.2" cy="12.2" r="0.75" />
        <circle cx="7.1" cy="10.4" r="0.75" />
        <circle cx="6.2" cy="8" r="0.75" />
        <circle cx="7.1" cy="5.6" r="0.75" />
        <circle cx="9.2" cy="3.8" r="0.75" />
      </g>
    </svg>
  );
}

function CnFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6" role="img">
      <rect width="24" height="16" fill="#DE2910" />
      <polygon
        fill="#FFDE00"
        points="6,2.5 6.9,5.2 9.8,5.2 7.45,6.9 8.35,9.6 6,7.9 3.65,9.6 4.55,6.9 2.2,5.2 5.1,5.2"
      />
      <circle cx="11.2" cy="2.2" r="0.55" fill="#FFDE00" />
      <circle cx="12.8" cy="3.6" r="0.55" fill="#FFDE00" />
      <circle cx="12.8" cy="5.6" r="0.55" fill="#FFDE00" />
      <circle cx="11.2" cy="7" r="0.55" fill="#FFDE00" />
      <circle cx="9.6" cy="5.6" r="0.55" fill="#FFDE00" />
    </svg>
  );
}
