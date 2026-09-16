import type { TransactionType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  findPeriodContaining,
  formatPeriodRange,
  getPeriodBuckets,
  getPeriodRange,
  isPeriod,
  type Period,
} from "@/lib/periods";
import { CashFlowChart } from "./cash-flow-chart";
import { BreakdownBars } from "./breakdown-bars";
import { ChartFilters, type GroupBy } from "./chart-filters";

const TOP_ITEMS = 6;
const CASH_FLOW_TYPES: TransactionType[] = ["INCOME", "EXPENSE"];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rawPeriod = firstParam(sp.period);
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : "thisMonth";
  const groupBy: GroupBy = firstParam(sp.groupBy) === "wallet" ? "wallet" : "category";

  const now = new Date();
  const { start, end } = getPeriodRange(period, now);
  const buckets = getPeriodBuckets(period, now);

  const outsidePeriod = {
    type: { in: CASH_FLOW_TYPES },
    OR: [{ date: { lt: start } }, { date: { gte: end } }],
  };

  const [transactions, outsideCount, latestOutside] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        type: { in: ["INCOME", "EXPENSE"] },
        date: { gte: start, lt: end },
      },
      select: {
        type: true,
        amount: true,
        date: true,
        category: { select: { name: true } },
        pocket: { select: { name: true } },
      },
    }),
    prisma.transaction.count({ where: outsidePeriod }),
    prisma.transaction.findFirst({
      where: outsidePeriod,
      orderBy: { date: "desc" },
      select: { date: true },
    }),
  ]);

  const cashFlow = buckets.map((bucket) => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.date >= bucket.start && tx.date < bucket.end) {
        if (tx.type === "INCOME") income += tx.amount;
        else expense += tx.amount;
      }
    }
    return {
      label: bucket.label,
      fullLabel: bucket.fullLabel,
      income,
      expense,
    };
  });

  function breakdownFor(wantedType: TransactionType) {
    const grouped = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== wantedType) continue;
      const key =
        groupBy === "wallet"
          ? (tx.pocket?.name ?? "Tanpa Wallet")
          : (tx.category?.name ?? "Tanpa Kategori");
      grouped.set(key, (grouped.get(key) ?? 0) + tx.amount);
    }
    const sorted = [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount }));
    const topItems = sorted.slice(0, TOP_ITEMS);
    const otherTotal = sorted
      .slice(TOP_ITEMS)
      .reduce((sum, item) => sum + item.amount, 0);
    return otherTotal > 0
      ? [...topItems, { name: "Lainnya", amount: otherTotal }]
      : topItems;
  }
  const outsideHint =
    outsideCount > 0 && latestOutside
      ? {
          count: outsideCount,
          dateLabel: formatDate(latestOutside.date),
          period: findPeriodContaining(latestOutside.date, now),
        }
      : null;

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-6 sm:mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pantau arus kas kamu
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Chart
          </h1>
        </header>

        <ChartFilters
          period={period}
          groupBy={groupBy}
          outsideHint={outsideHint}
          trend={
            <CashFlowChart
              buckets={cashFlow}
              rangeLabel={formatPeriodRange(period, now)}
            />
          }
          expenseBreakdown={
            <BreakdownBars
              items={breakdownFor("EXPENSE")}
              emptyLabel="Belum ada pengeluaran pada periode ini."
            />
          }
          incomeBreakdown={
            <BreakdownBars
              items={breakdownFor("INCOME")}
              emptyLabel="Belum ada pemasukan pada periode ini."
            />
          }
        />
      </div>
    </div>
  );
}
