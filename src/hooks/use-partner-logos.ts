'use client';

import { useQuery } from '@tanstack/react-query';

export type PublicPartnerLogo = {
  name: string;
  logoUrl: string;
};

export function usePartnerLogos() {
  return useQuery({
    queryKey: ['public-partners', 'logos'],
    queryFn: async (): Promise<PublicPartnerLogo[]> => {
      const response = await fetch('/api/partners', { credentials: 'include' });
      if (!response.ok) return [];
      const json = (await response.json()) as { logos?: PublicPartnerLogo[] };
      return json.logos ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
