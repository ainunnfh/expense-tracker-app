import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { calculateBalances } from "@/lib/transactions";
import { requireUser } from "@/lib/auth";
import { seedDefaultCategories } from "@/lib/categories";
import { createWallet } from "./actions";

export default async function WalletsPage() {
  const user = await requireUser();
  await seedDefaultCategories(user.id);

  const [wallets, balanceInputs] = await Promise.all([
    prisma.pocket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        amount: true,
        pocketId: true,
        fromPocketId: true,
        toPocketId: true,
      },
    }),
  ]);

  const balances = calculateBalances(wallets, balanceInputs);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kelola uang kamu
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Wallet
          </h1>
        </header>

        <section>
          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {wallets.map((wallet) => (
                <Link
                  key={wallet.id}
                  href={`/wallets/${wallet.id}`}
                  className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {wallet.name}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(balances.get(wallet.id) ?? 0)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Belum ada wallet. Tambahkan satu untuk mulai mencatat.
            </p>
          )}

          <form action={createWallet} className="mt-3 flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="Nama wallet baru (cth. Tabungan)"
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Tambah Wallet
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
