import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type CashFlowBucket = {
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
};

export function CashFlowChart({
  buckets,
  rangeLabel,
}: {
  buckets: CashFlowBucket[];
  rangeLabel: string;
}) {
  const hasData = buckets.some((b) => b.income > 0 || b.expense > 0);
  const maxValue = Math.max(1, ...buckets.flatMap((b) => [b.income, b.expense]));
  const totalIncome = buckets.reduce((sum, b) => sum + b.income, 0);
  const totalExpense = buckets.reduce((sum, b) => sum + b.expense, 0);
  // A month renders ~31 columns: tighten the gaps and thin the bars so they fit.
  const dense = buckets.length > 12;
  const labelStep = dense ? 5 : 1;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="size-2 rounded-full bg-emerald-500" />
          Pemasukan
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totalIncome)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <span className="size-2 rounded-full bg-rose-500" />
          Pengeluaran
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatCurrency(totalExpense)}
          </span>
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-zinc-400 dark:text-zinc-500">
        <p>{rangeLabel}</p>
        {hasData ? <p>maks {formatCompactCurrency(maxValue)}</p> : null}
      </div>

      {hasData ? (
        <div
          className={
            dense
              ? "mt-5 flex items-stretch justify-between gap-px"
              : "mt-5 flex items-stretch justify-between gap-1 sm:gap-2"
          }
        >
          {buckets.map((bucket, i) => {
            const incomePct = (bucket.income / maxValue) * 100;
            const expensePct = (bucket.expense / maxValue) * 100;
            const net = bucket.income - bucket.expense;
            const nearStart = i < 2;
            const nearEnd = i >= buckets.length - 2;

            return (
              <div
                key={i}
                tabIndex={0}
                className="group/bar relative flex flex-1 flex-col items-center outline-none"
              >
                <div
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-[10rem] rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs opacity-0 shadow-md transition-opacity group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 ${
                    nearStart
                      ? "left-0"
                      : nearEnd
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {bucket.fullLabel}
                  </p>
                  <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">
                      {formatCurrency(bucket.income)}
                    </span>{" "}
                    pemasukan
                  </p>
                  <p className="text-rose-600 dark:text-rose-400">
                    <span className="font-medium">
                      {formatCurrency(bucket.expense)}
                    </span>{" "}
                    pengeluaran
                  </p>
                  <p className="mt-1 border-t border-zinc-200 pt-1 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    Net {formatCurrency(net)}
                  </p>
                </div>

                <div className="flex h-20 w-full items-end justify-center sm:h-28">
                  <div
                    style={{ height: `${incomePct}%` }}
                    className={`w-full rounded-t-[4px] bg-emerald-500 transition-opacity group-hover/bar:opacity-80 dark:bg-emerald-500/90 ${
                      dense ? "max-w-2" : "max-w-6"
                    }`}
                  />
                </div>
                <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="flex h-20 w-full items-start justify-center sm:h-28">
                  <div
                    style={{ height: `${expensePct}%` }}
                    className={`w-full rounded-b-[4px] bg-rose-500 transition-opacity group-hover/bar:opacity-80 dark:bg-rose-500/90 ${
                      dense ? "max-w-2" : "max-w-6"
                    }`}
                  />
                </div>

                <p className="mt-2 h-4 text-[10px] text-zinc-500 dark:text-zinc-400 sm:text-xs">
                  {i % labelStep === 0 ? bucket.label : ""}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Belum ada transaksi pada periode ini.
        </p>
      )}
    </div>
  );
}
