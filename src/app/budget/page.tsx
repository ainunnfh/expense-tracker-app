import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { isMonthKey } from "@/lib/months";
import {
  cycleContaining,
  cycleFromKey,
  cycleRangeLabel,
  cycleTitle,
  shiftCycle,
} from "@/lib/cycle";
import { getMonthStartDay } from "@/lib/settings";
import { copyBudgetFromPreviousMonth, setBudget } from "./actions";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Under 80% of the target is fine, up to 100% is tight, past it is an overrun. */
function statusOf(spent: number, target: number) {
  if (target <= 0) return null;
  const ratio = spent / target;
  if (ratio > 1) {
    return {
      label: `Lewat ${formatCurrency(spent - target)}`,
      bar: "bg-rose-600 dark:bg-rose-500",
      text: "text-rose-600 dark:text-rose-400",
    };
  }
  if (ratio >= 0.8) {
    return {
      label: `Sisa ${formatCurrency(target - spent)}`,
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: `Sisa ${formatCurrency(target - spent)}`,
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  };
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const monthStartDay = await getMonthStartDay();
  const requested = firstParam((await searchParams).month);
  const cycle = isMonthKey(requested)
    ? cycleFromKey(requested, monthStartDay)
    : cycleContaining(new Date(), monthStartDay);
  const month = cycle.key;
  const { start, end } = cycle;
  const previous = shiftCycle(cycle, -1, monthStartDay);
  const next = shiftCycle(cycle, 1, monthStartDay);

  const [categories, budgets, spending, previousCount] = await Promise.all([
    prisma.category.findMany({
      where: { type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({ where: { month } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.budget.count({ where: { month: previous.key } }),
  ]);

  const targetOf = new Map(budgets.map((b) => [b.categoryId, b.amount]));
  const spentOf = new Map(
    spending
      .filter((row) => row.categoryId != null)
      .map((row) => [row.categoryId as number, row._sum.amount ?? 0]),
  );

  const rows = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      target: targetOf.get(category.id) ?? 0,
      spent: spentOf.get(category.id) ?? 0,
    }))
    .sort((a, b) => {
      if (Boolean(b.target) !== Boolean(a.target)) return b.target ? 1 : -1;
      return b.spent - a.spent || a.name.localeCompare(b.name);
    });

  const totalTarget = rows.reduce((sum, row) => sum + row.target, 0);
  const totalSpent = rows
    .filter((row) => row.target > 0)
    .reduce((sum, row) => sum + row.spent, 0);
  const uncategorised =
    spending.find((row) => row.categoryId == null)?._sum.amount ?? 0;
  const budgetedCount = rows.filter((row) => row.target > 0).length;
  const totalStatus = statusOf(totalSpent, totalTarget);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-6 sm:mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Atur target pengeluaran per kategori
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Budget
          </h1>
        </header>

        {/* Month nav is plain links so it works without JS. */}
        <div className="mb-6 flex items-center gap-2">
          <Link
            href={`/budget?month=${previous.key}`}
            aria-label="Bulan sebelumnya"
            className="flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            ‹
          </Link>
          <span className="min-w-44 text-center">
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {cycleTitle(cycle)}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {cycleRangeLabel(cycle)}
            </span>
          </span>
          <Link
            href={`/budget?month=${next.key}`}
            aria-label="Bulan berikutnya"
            className="flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            ›
          </Link>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
          {budgetedCount === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada target bulan ini. Isi nominal di kategori mana pun di
              bawah untuk mulai.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Total target{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(totalTarget)}
                  </span>
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Terpakai{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(totalSpent)}
                  </span>
                </span>
                <span className={`font-medium ${totalStatus?.text ?? ""}`}>
                  {totalStatus?.label}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className={`h-full rounded-full ${totalStatus?.bar ?? ""}`}
                  style={{
                    width: `${Math.min(100, totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0)}%`,
                  }}
                />
              </div>
            </>
          )}

          {budgetedCount === 0 && previousCount > 0 ? (
            <form action={copyBudgetFromPreviousMonth} className="mt-3">
              <input type="hidden" name="month" value={month} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Salin target dari {cycleTitle(previous)}
              </button>
            </form>
          ) : null}
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Target per Kategori
          </h2>

          {rows.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              Belum ada kategori pengeluaran.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {rows.map((row) => {
                const status = statusOf(row.spent, row.target);
                const percent =
                  row.target > 0
                    ? Math.min(100, (row.spent / row.target) * 100)
                    : 0;

                return (
                  <li key={row.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {row.name}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {row.target > 0 ? (
                          <>
                            {formatCurrency(row.spent)} dari{" "}
                            {formatCurrency(row.target)}
                            {status ? (
                              <span className={`ml-2 ${status.text}`}>
                                {status.label}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <>Terpakai {formatCurrency(row.spent)} · belum ada target</>
                        )}
                      </span>
                    </div>

                    {row.target > 0 ? (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                        <div
                          className={`h-full rounded-full ${status?.bar ?? ""}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    ) : null}

                    <form action={setBudget} className="mt-3 flex gap-2">
                      <input type="hidden" name="categoryId" value={row.id} />
                      <input type="hidden" name="month" value={month} />
                      <input
                        type="number"
                        name="amount"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        defaultValue={row.target > 0 ? row.target : ""}
                        placeholder="Target bulan ini (Rp)"
                        aria-label={`Target untuk ${row.name}`}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      >
                        Simpan
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          {uncategorised > 0 ? (
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              {formatCurrency(uncategorised)} pengeluaran periode ini belum
              berkategori, jadi tidak terhitung di target mana pun.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
