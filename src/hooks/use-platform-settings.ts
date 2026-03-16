import { useQuery } from '@tanstack/react-query';

export interface PlatformSettings {
  cashoutFeeRate: number;
  networkFeeCentimes: number;
  affiliateCommissionRate: number;
}

const DEFAULTS: PlatformSettings = {
  cashoutFeeRate: 0.005,
  networkFeeCentimes: 200,
  affiliateCommissionRate: 0.02,
};

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return DEFAULTS;
  return res.json();
}

export function usePlatformSettings() {
  return useQuery<PlatformSettings>({
    queryKey: ['platform-settings'],
    queryFn: fetchPlatformSettings,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULTS,
  });
}
