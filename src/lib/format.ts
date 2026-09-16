export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
  }).format(date);
}

export function formatWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
  }).format(date);
}

export function formatMonthYearLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "numeric",
  }).format(date);
}
