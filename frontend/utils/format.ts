/**
 * Formatting helpers. Currency is centralised here (not hard-coded per screen)
 * so it can later be driven by marketplace/location configuration.
 */
const DEFAULT_CURRENCY = 'INR';

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  if (amount == null || isNaN(amount)) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(iso);
  }
}
