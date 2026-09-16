import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createCategory, deleteCategory, renameCategory } from "./actions";
import { CATEGORY_MESSAGES, MAX_CATEGORY_NAME } from "./messages";

const inputClass =
  "min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600";
const ghostButton =
  "shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type Row = {
  id: number;
  name: string;
  used: number;
  budgets: number;
};

function CategoryList({
  title,
  rows,
  confirmId,
}: {
  title: string;
  rows: Row[];
  confirmId: number | null;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-5 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Belum ada kategori di sini.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3 sm:px-5">
              {confirmId === row.id ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-900 dark:text-zinc-50">
                    Hapus kategori{" "}
                    <span className="font-medium">{row.name}</span>?
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {row.used > 0
                      ? `${row.used} transaksi akan jadi "Tanpa Kategori" (nominalnya tetap aman).`
                      : "Belum dipakai transaksi mana pun."}
                    {row.budgets > 0
                      ? ` ${row.budgets} target budget untuk kategori ini ikut terhapus.`
                      : ""}
                  </p>
                  <div className="flex gap-2">
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700"
                      >
                        Ya, hapus
                      </button>
                    </form>
                    <Link href="/settings/categories" className={ghostButton}>
                      Batal
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    action={renameCategory}
                    className="flex min-w-0 flex-1 gap-2"
                  >
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={row.name}
                      required
                      maxLength={MAX_CATEGORY_NAME}
                      aria-label={`Nama kategori ${row.name}`}
                      className={inputClass}
                    />
                    <button type="submit" className={ghostButton}>
                      Simpan
                    </button>
                  </form>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {row.used} transaksi
                  </span>
                  <Link
                    href={`/settings/categories?confirm=${row.id}`}
                    className="rounded-lg px-2 py-2 text-xs font-medium text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400"
                  >
                    Hapus
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const message = CATEGORY_MESSAGES[firstParam(sp.msg) ?? ""];
  const confirmRaw = Number(firstParam(sp.confirm));
  const confirmId = Number.isInteger(confirmRaw) && confirmRaw > 0 ? confirmRaw : null;

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true, budgets: true } } },
  });

  const toRow = (type: "INCOME" | "EXPENSE"): Row[] =>
    categories
      .filter((c) => c.type === type)
      .map((c) => ({
        id: c.id,
        name: c.name,
        used: c._count.transactions,
        budgets: c._count.budgets,
      }));

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Setelan
        </Link>

        <header className="mb-6 mt-3 sm:mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kategori dipakai saat mencatat transaksi dan menyusun budget
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Kategori
          </h1>
        </header>

        {message ? (
          <p
            role="status"
            className={
              message.tone === "ok"
                ? "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            }
          >
            {message.text}
          </p>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Tambah kategori
          </h2>
          <form action={createCategory} className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              name="name"
              required
              maxLength={MAX_CATEGORY_NAME}
              placeholder="cth. Kopi"
              aria-label="Nama kategori baru"
              className={inputClass}
            />
            <select
              name="type"
              defaultValue="EXPENSE"
              aria-label="Jenis kategori"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Tambah
            </button>
          </form>
        </section>

        <CategoryList
          title="Kategori Pengeluaran"
          rows={toRow("EXPENSE")}
          confirmId={confirmId}
        />
        <CategoryList
          title="Kategori Pemasukan"
          rows={toRow("INCOME")}
          confirmId={confirmId}
        />
      </div>
    </div>
  );
}
