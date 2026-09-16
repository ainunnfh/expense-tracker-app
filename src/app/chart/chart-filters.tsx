"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/periods";

export type GroupBy = "category" | "wallet";

type Selection = { period: Period; groupBy: GroupBy };

/** Transactions that exist but fall outside the selected period. */
export type OutsideHint = {
  count: number;
  dateLabel: string;
  period: Period | null;
} | null;

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "category", label: "Kategori" },
  { value: "wallet", label: "Wallet" },
];

function hrefFor(selection: Selection) {
  const params = new URLSearchParams({
    period: selection.period,
    groupBy: selection.groupBy,
  });
  return `/chart?${params.toString()}`;
}

const ACTIVE_PILL =
  "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white dark:bg-zinc-50 dark:text-zinc-900";
const IDLE_PILL =
  "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200";

function PillGroup<T extends string>({
  options,
  value,
  hrefOf,
  onSelect,
}: {
  options: { value: T; label: string }[];
  value: T;
  hrefOf: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefOf(option.value)}
          scroll={false}
          aria-current={option.value === value ? "true" : undefined}
          onClick={() => onSelect(option.value)}
          className={option.value === value ? ACTIVE_PILL : IDLE_PILL}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

/**
 * Native <details> disclosure holding plain links, so picking a period works
 * even before React has hydrated — a <select> would only move its own value.
 */
function PeriodPicker({
  selection,
  onSelect,
}: {
  selection: Selection;
  onSelect: (period: Period) => void;
}) {
  const details = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={details} className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 [&::-webkit-details-marker]:hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
        {PERIOD_LABELS[selection.period]}
        <span aria-hidden className="text-zinc-400 dark:text-zinc-500">
          ▾
        </span>
      </summary>

      <div className="absolute left-0 z-20 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        {PERIODS.map((period) => {
          const active = period === selection.period;
          return (
            <Link
              key={period}
              href={hrefFor({ ...selection, period })}
              scroll={false}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                details.current?.removeAttribute("open");
                onSelect(period);
              }}
              className={
                active
                  ? "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-50"
                  : "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }
            >
              {PERIOD_LABELS[period]}
              {active ? <span aria-hidden>✓</span> : null}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export function ChartFilters({
  period,
  groupBy,
  outsideHint,
  trend,
  expenseBreakdown,
  incomeBreakdown,
}: {
  period: Period;
  groupBy: GroupBy;
  outsideHint: OutsideHint;
  trend: ReactNode;
  expenseBreakdown: ReactNode;
  incomeBreakdown: ReactNode;
}) {
  const fromServer: Selection = { period, groupBy };

  // The picked value shows immediately while the server render is in flight;
  // it clears itself once the new props land (re-synced during render, not in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect).
  const [prev, setPrev] = useState(fromServer);
  const [picked, setPicked] = useState<Selection | null>(null);

  if (prev.period !== period || prev.groupBy !== groupBy) {
    setPrev(fromServer);
    setPicked(null);
  }

  const selection = picked ?? fromServer;
  const isPending = picked !== null;

  function pick(patch: Partial<Selection>) {
    const next = { ...selection, ...patch };
    if (next.period === selection.period && next.groupBy === selection.groupBy) {
      return;
    }
    setPicked(next);
  }

  const groupByLabel = selection.groupBy === "wallet" ? "Wallet" : "Kategori";
  const periodLabel = PERIOD_LABELS[selection.period];
  const dimClass = isPending
    ? "opacity-60 transition-opacity"
    : "opacity-100 transition-opacity";

  return (
    <>
      <div className="mb-2 flex flex-wrap items-start gap-2">
        <PeriodPicker
          selection={selection}
          onSelect={(value) => pick({ period: value })}
        />
        <PillGroup
          options={GROUP_BY_OPTIONS}
          value={selection.groupBy}
          hrefOf={(value) => hrefFor({ ...selection, groupBy: value })}
          onSelect={(value) => pick({ groupBy: value })}
        />
      </div>

      <p className="mb-6 min-h-4 text-xs text-zinc-400 dark:text-zinc-500">
        {isPending || !outsideHint ? null : (
          <>
            {outsideHint.count} transaksi lain ada di luar periode ini — yang
            terbaru {outsideHint.dateLabel}.
            {outsideHint.period ? (
              <>
                {" "}
                <Link
                  href={hrefFor({ ...selection, period: outsideHint.period })}
                  scroll={false}
                  onClick={() => pick({ period: outsideHint.period! })}
                  className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  Lihat di {PERIOD_LABELS[outsideHint.period]}
                </Link>
              </>
            ) : null}
          </>
        )}
      </p>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Arus Kas ({periodLabel})
        </h2>
        <div className={dimClass}>{trend}</div>
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Pengeluaran per {groupByLabel} ({periodLabel})
        </h2>
        <div className={dimClass}>{expenseBreakdown}</div>
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Pemasukan per {groupByLabel} ({periodLabel})
        </h2>
        <div className={dimClass}>{incomeBreakdown}</div>
      </section>
    </>
  );
}
