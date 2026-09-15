type Transaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
};

const summary = {
  balance: 12_450_000,
  income: 8_500_000,
  expense: 3_200_000,
};

const transactions: Transaction[] = [
  {
    id: "1",
    name: "Gaji Bulanan",
    category: "Gaji",
    date: "14 Sep 2026",
    amount: 8_500_000,
    type: "income",
  },
  {
    id: "2",
    name: "Belanja Bulanan",
    category: "Rumah Tangga",
    date: "13 Sep 2026",
    amount: 750_000,
    type: "expense",
  },
  {
    id: "3",
    name: "Kopi & Makan Siang",
    category: "Makanan",
    date: "12 Sep 2026",
    amount: 85_000,
    type: "expense",
  },
  {
    id: "4",
    name: "Langganan Streaming",
    category: "Hiburan",
    date: "10 Sep 2026",
    amount: 65_000,
    type: "expense",
  },
  {
    id: "5",
    name: "Bensin",
    category: "Transportasi",
    date: "09 Sep 2026",
    amount: 300_000,
    type: "expense",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
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
              {formatCurrency(summary.balance)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pemasukan
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400 sm:text-xl">
              +{formatCurrency(summary.income)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pengeluaran
            </p>
            <p className="mt-2 text-lg font-semibold text-rose-600 dark:text-rose-400 sm:text-xl">
              -{formatCurrency(summary.expense)}
            </p>
          </div>
        </section>

        <section className="mt-8 sm:mt-10">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Transaksi Terbaru
          </h2>

          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {transaction.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {transaction.category} · {transaction.date}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "income"
                      ? "shrink-0 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400"
                      : "shrink-0 whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
