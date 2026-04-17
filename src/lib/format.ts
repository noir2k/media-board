export function formatSignedNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, {
    signDisplay: "always",
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCompactCurrency(
  value: number,
  locale: string,
  currency: string,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(
  value: number,
  locale: string,
  currency: string,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatDateTime(
  dateLike: string | number | Date,
  locale: string,
  timezone: string,
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(dateLike));
}

export function formatDayLabel(
  dateLike: string | number | Date,
  locale: string,
  timezone: string,
) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: timezone,
  }).format(new Date(dateLike));
}
