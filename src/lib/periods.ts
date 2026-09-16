import {
  formatDate,
  formatMonthLabel,
  formatMonthYearLabel,
  formatWeekdayLabel,
} from "./format";

export const PERIODS = [
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "lastYear",
] as const;

export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  thisWeek: "Minggu Ini",
  lastWeek: "Minggu Lalu",
  thisMonth: "Bulan Ini",
  lastMonth: "Bulan Lalu",
  thisYear: "Tahun Ini",
  lastYear: "Tahun Lalu",
};

export function isPeriod(value: unknown): value is Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value);
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

export function getPeriodRange(period: Period, now = new Date()) {
  switch (period) {
    case "thisWeek": {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "lastWeek": {
      const end = startOfWeek(now);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { start, end };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case "lastYear": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
  }
}

/** Narrowest period that still contains `date`, for "lihat di ..." shortcuts. */
export function findPeriodContaining(date: Date, now = new Date()): Period | null {
  return (
    PERIODS.find((period) => {
      const { start, end } = getPeriodRange(period, now);
      return date >= start && date < end;
    }) ?? null
  );
}

export type PeriodBucket = {
  start: Date;
  end: Date;
  /** Short axis tick, e.g. "Sel" / "15" / "Sep". */
  label: string;
  /** Unambiguous label for the tooltip, e.g. "15 Sep 2026". */
  fullLabel: string;
};

/** Human-readable span of a period, e.g. "14 – 20 Sep 2026". */
export function formatPeriodRange(period: Period, now = new Date()) {
  const { start, end } = getPeriodRange(period, now);
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  return `${formatDate(start)} – ${formatDate(last)}`;
}

/** Time buckets for the trend chart: weeks/months plot per day, years per month. */
export function getPeriodBuckets(period: Period, now = new Date()): PeriodBucket[] {
  const { start, end } = getPeriodRange(period, now);

  if (period === "thisYear" || period === "lastYear") {
    return Array.from({ length: 12 }, (_, month) => {
      const bucketStart = new Date(start.getFullYear(), month, 1);
      const bucketEnd = new Date(start.getFullYear(), month + 1, 1);
      return {
        start: bucketStart,
        end: bucketEnd,
        label: formatMonthLabel(bucketStart),
        fullLabel: formatMonthYearLabel(bucketStart),
      };
    });
  }

  const perWeekday = period === "thisWeek" || period === "lastWeek";
  const buckets: PeriodBucket[] = [];
  for (
    const cursor = new Date(start);
    cursor < end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 1);
    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: perWeekday
        ? formatWeekdayLabel(bucketStart)
        : String(bucketStart.getDate()),
      fullLabel: formatDate(bucketStart),
    });
  }
  return buckets;
}
