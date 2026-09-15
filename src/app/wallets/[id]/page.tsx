import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { calculateBalances, describeTransaction } from "@/lib/transactions";
import { deleteTransaction } from "../actions";
import { WalletForm } from "../wallet-form";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const walletId = Number(id);
  if (!Number.isFinite(walletId)) notFound();

  const wallet = await prisma.pocket.findUnique({ where: { id: walletId } });
  if (!wallet) notFound();

  const [allWallets, categories, balanceInputs, transactions] = await Promise.all([
    prisma.pocket.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      select: {
        type: true,
        amount: true,
        pocketId: true,
        fromPocketId: true,
        toPocketId: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { pocketId: walletId },
          { fromPocketId: walletId },
          { toPocketId: walletId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { pocket: true, category: true, fromPocket: true, toPocket: true },
    }),
  ]);

  const balances = calculateBalances(allWallets, balanceInputs);
  const balance = balances.get(walletId) ?? 0;
  const otherWallets = allWallets.filter((w) => w.id !== walletId);
  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/wallets"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Semua Wallet
        </Link>

        <header className="mb-8 mt-3 sm:mb-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{wallet.name}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            {formatCurrency(balance)}
          </h1>
        </header>

        <section className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Catat Transaksi
          </h2>
          <WalletForm
            wallet={{ id: wallet.id, name: wallet.name, balance }}
            otherWallets={otherWallets.map((w) => ({
              id: w.id,
              name: w.name,
              balance: balances.get(w.id) ?? 0,
            }))}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Riwayat Transaksi
          </h2>

          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {transactions.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Belum ada transaksi.
              </li>
            ) : (
              transactions.map((tx) => {
                const { title, subtitle } = describeTransaction(tx);
                const isOutflow =
                  tx.type === "EXPENSE" ||
                  (tx.type === "TRANSFER" && tx.fromPocketId === walletId);
                const isInflow =
                  tx.type === "INCOME" ||
                  (tx.type === "TRANSFER" && tx.toPocketId === walletId);

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
                    <div className="flex shrink-0 items-center gap-3">
                      <p
                        className={
                          isInflow
                            ? "whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400"
                            : isOutflow
                              ? "whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400"
                              : "whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50"
                        }
                      >
                        {isInflow ? "+" : isOutflow ? "-" : ""}
                        {formatCurrency(tx.amount)}
                      </p>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          type="submit"
                          aria-label="Hapus transaksi"
                          className="text-xs text-zinc-400 hover:text-rose-600 dark:text-zinc-600 dark:hover:text-rose-400"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
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
