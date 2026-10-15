/** Quote APIs return French (or mixed) delay labels. Map them to the active locale. */
export function localizeEstimatedDelivery(
  raw: string,
  labels: {
    fewMinutes: string;
    instant: string;
    upTo24h: string;
  }
): string {
  switch (raw) {
    case 'Quelques minutes à 1h':
      return labels.fewMinutes;
    case 'Instantané':
    case 'Instant':
      return labels.instant;
    case 'Instantané à 24h':
    case 'Instant to 24h':
      return labels.upTo24h;
    default:
      return raw;
  }
}
