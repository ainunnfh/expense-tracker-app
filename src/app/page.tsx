import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { calculateBalances, describeTransaction } from "@/lib/transactions";

export default async function Home() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [pockets, balanceInputs, monthIncome, monthExpense, transactions] =
    await Promise.all([
      prisma.pocket.findMany({ select: { id: true } }),
      prisma.transaction.findMany({
        select: {
          type: true,
          amount: true,
          pocketId: true,
          fromPocketId: true,
          toPocketId: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { type: "INCOME", date: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "EXPENSE", date: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { pocket: true, category: true, fromPocket: true, toPocket: true },
      }),
    ]);

  const balances = calculateBalances(pockets, balanceInputs);
  const totalBalance = [...balances.values()].reduce((sum, v) => sum + v, 0);
  const income = monthIncome._sum.amount ?? 0;
  const expense = monthExpense._sum.amount ?? 0;

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ringkasan keuangan kamu
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Dashboard
          </h1>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Saldo
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pemasukan Bulan Ini
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400 sm:text-xl">
              +{formatCurrency(income)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pengeluaran Bulan Ini
            </p>
            <p className="mt-2 text-lg font-semibold text-rose-600 dark:text-rose-400 sm:text-xl">
              -{formatCurrency(expense)}
            </p>
          </div>
        </section>

        <section className="mt-8 sm:mt-10">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Transaksi Terbaru
          </h2>

          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {transactions.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Belum ada transaksi. Mulai catat di halaman Wallet.
              </li>
            ) : (
              transactions.map((tx) => {
                const { title, subtitle } = describeTransaction(tx);
                return (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {subtitle}
                      </p>
                    </div>
                    <p
                      className={
                        tx.type === "INCOME"
                          ? "shrink-0 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400"
                          : tx.type === "EXPENSE"
                            ? "shrink-0 whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400"
                            : "shrink-0 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50"
                      }
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(tx.amount)}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
