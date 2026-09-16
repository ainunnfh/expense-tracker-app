import { formatDate } from "./format";

/** Days past 28 don't exist in every month, so the cycle start is capped there. */
export const MAX_MONTH_START_DAY = 28;

export function normalizeMonthStartDay(value: unknown) {
  const day = Math.trunc(Number(value));
  if (!Number.isFinite(day)) return 1;
  return Math.min(MAX_MONTH_START_DAY, Math.max(1, day));
}

export type Cycle = {
  /** "YYYY-MM" — the calendar month this cycle is named after. */
  key: string;
  start: Date;
  /** Exclusive. */
  end: Date;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A cycle is named after the month holding most of its days: a cycle starting
 * late in the month (a 25th payday) spills into the next month and takes that
 * month's name, which is how people refer to it.
 */
function keyFor(start: Date, startDay: number) {
  if (startDay <= 15) return monthKey(start);
  return monthKey(new Date(start.getFullYear(), start.getMonth() + 1, 1));
}

/** The cycle that contains `date`. */
export function cycleContaining(date: Date, startDay: number): Cycle {
  const day = normalizeMonthStartDay(startDay);
  const anchorMonth =
    date.getDate() >= day ? date.getMonth() : date.getMonth() - 1;
  const start = new Date(date.getFullYear(), anchorMonth, day);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, day);
  return { key: keyFor(start, day), start, end };
}

/** The cycle named `key` ("YYYY-MM"), reversing the naming rule above. */
export function cycleFromKey(key: string, startDay: number): Cycle {
  const day = normalizeMonthStartDay(startDay);
  const [year, month] = key.split("-").map(Number);
  // A late start day means the cycle began in the previous calendar month.
  const startMonth = day <= 15 ? month - 1 : month - 2;
  const start = new Date(year, startMonth, day);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, day);
  return { key, start, end };
}

export function shiftCycle(cycle: Cycle, delta: number, startDay: number) {
  const day = normalizeMonthStartDay(startDay);
  const start = new Date(
    cycle.start.getFullYear(),
    cycle.start.getMonth() + delta,
    day,
  );
  return cycleContaining(start, day);
}

/** "01 Sep 2026 – 30 Sep 2026" — the last day is inclusive for humans. */
export function cycleRangeLabel(cycle: Cycle) {
  const last = new Date(cycle.end);
  last.setDate(last.getDate() - 1);
  return `${formatDate(cycle.start)} – ${formatDate(last)}`;
}

export function cycleTitle(cycle: Cycle) {
  const [year, month] = cycle.key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}
