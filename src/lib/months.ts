/** A month key is "YYYY-MM", e.g. "2026-09". */
export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-").map(Number);
  const shifted = new Date(year, index - 1 + delta, 1);
  return currentMonthKey(shifted);
}

export function previousMonth(month: string) {
  return shiftMonth(month, -1);
}

export function nextMonth(month: string) {
  return shiftMonth(month, 1);
}

export function monthRange(month: string) {
  const [year, index] = month.split("-").map(Number);
  return {
    start: new Date(year, index - 1, 1),
    end: new Date(year, index, 1),
  };
}

export function monthTitle(month: string) {
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, index - 1, 1));
}
