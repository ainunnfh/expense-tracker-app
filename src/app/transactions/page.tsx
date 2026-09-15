import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { calculateBalances, describeTransaction } from "@/lib/transactions";
import { createPocket, deleteTransaction } from "./actions";
import { TransactionForm } from "./transaction-form";

const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "INCOME" as const },
  { name: "Bonus", type: "INCOME" as const },
  { name: "Investasi", type: "INCOME" as const },
  { name: "Hadiah", type: "INCOME" as const },
  { name: "Lainnya", type: "INCOME" as const },
  { name: "Makanan", type: "EXPENSE" as const },
  { name: "Transportasi", type: "EXPENSE" as const },
  { name: "Belanja", type: "EXPENSE" as const },
  { name: "Tagihan", type: "EXPENSE" as const },
  { name: "Hiburan", type: "EXPENSE" as const },
  { name: "Kesehatan", type: "EXPENSE" as const },
  { name: "Pendidikan", type: "EXPENSE" as const },
  { name: "Lainnya", type: "EXPENSE" as const },
];

async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULT_CATEGORIES });
}

export default async function TransactionsPage() {
  await ensureDefaultCategories();

  const [pockets, categories, transactions, balanceInputs] =
    await Promise.all([
      prisma.pocket.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 30,
        include: { pocket: true, category: true, fromPocket: true, toPocket: true },
      }),
      prisma.transaction.findMany({
        select: {
          type: true,
          amount: true,
          pocketId: true,
          fromPocketId: true,
          toPocketId: true,
        },
      }),
    ]);

  const balances = calculateBalances(pockets, balanceInputs);
  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kelola uang kamu
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Transaksi
          </h1>
        </header>

        <section className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Kantong
          </h2>

          {pockets.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pockets.map((pocket) => (
                <div
                  key={pocket.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {pocket.name}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(balances.get(pocket.id) ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada kantong. Tambahkan satu untuk mulai mencatat.
            </p>
          )}

          <form action={createPocket} className="mt-3 flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Nama kantong baru (cth. Tabungan)"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Tambah
            </button>
          </form>
        </section>

        <section className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Catat Transaksi
          </h2>
          <TransactionForm
            pockets={pockets.map((p) => ({ id: p.id, name: p.name }))}
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
                        tx.type === "INCOME"
                          ? "whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400"
                          : tx.type === "EXPENSE"
                            ? "whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400"
                            : "whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50"
                      }
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
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
