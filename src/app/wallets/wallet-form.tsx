"use client";

import Link from "next/link";
import { useActionState, useRef, type ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import { createExpense, createIncome, createTransfer, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600";

function today() {
  // Local date, not toISOString() — that returns UTC, which lands on the
  // previous day for anyone east of UTC during their early-morning hours.
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

type Wallet = { id: number; name: string; balance: number };
type Category = { id: number; name: string };
export type Tab = "income" | "expense" | "transfer";

export function WalletForm({
  tab,
  wallet,
  otherWallets,
  incomeCategories,
  expenseCategories,
}: {
  tab: Tab;
  wallet: Wallet;
  otherWallets: Wallet[];
  incomeCategories: Category[];
  expenseCategories: Category[];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Tabs are links, not buttons: a tap works from the server-rendered
          HTML, before React has hydrated the page. */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <TabLink active={tab === "income"} href={`/wallets/${wallet.id}?tab=income`}>
          Pemasukan
        </TabLink>
        <TabLink active={tab === "expense"} href={`/wallets/${wallet.id}?tab=expense`}>
          Pengeluaran
        </TabLink>
        <TabLink
          active={tab === "transfer"}
          href={`/wallets/${wallet.id}?tab=transfer`}
        >
          Transfer
        </TabLink>
      </div>

      <div className="p-4 sm:p-5">
        {tab === "income" ? (
          <IncomeExpenseForm
            key="income"
            action={createIncome}
            walletId={wallet.id}
            categories={incomeCategories}
            submitLabel="Simpan Pemasukan"
            accent="emerald"
          />
        ) : tab === "expense" ? (
          <IncomeExpenseForm
            key="expense"
            action={createExpense}
            walletId={wallet.id}
            categories={expenseCategories}
            submitLabel="Simpan Pengeluaran"
            accent="rose"
          />
        ) : otherWallets.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Tambahkan wallet lain dulu untuk bisa transfer.
          </p>
        ) : (
          <TransferForm walletId={wallet.id} otherWallets={otherWallets} />
        )}
      </div>
    </div>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "flex-1 border-b-2 border-zinc-900 px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
          : "flex-1 border-b-2 border-transparent px-4 py-3 text-center text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }
    >
      {children}
    </Link>
  );
}

function readableDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/**
 * Calendar picker built entirely from radios + CSS :has(), so it needs no
 * JavaScript at all: opening it, switching months and picking a day all work
 * from the server-rendered HTML. JS only adds the nicety of auto-closing.
 */
const MONTHS_BACK = 12;
const MONTHS_AHEAD = 1;

function buildMonths(from: string) {
  const [baseYear, baseMonth] = from.split("-").map(Number);
  return Array.from(
    { length: MONTHS_BACK + MONTHS_AHEAD + 1 },
    (_, index) => {
      const at = new Date(baseYear, baseMonth - 1 - MONTHS_BACK + index, 1);
      const year = at.getFullYear();
      const month = at.getMonth() + 1;
      return {
        key: `${year}-${pad(month)}`,
        year,
        month,
        days: new Date(year, month, 0).getDate(),
        blanks: (new Date(year, month - 1, 1).getDay() + 6) % 7,
      };
    },
  );
}

function DateField() {
  const details = useRef<HTMLDetailsElement>(null);
  const initial = today();
  const months = buildMonths(initial.slice(0, 7));
  const allDates = months.flatMap((m) =>
    Array.from({ length: m.days }, (_, i) => `${m.key}-${pad(i + 1)}`),
  );

  const rules = [
    // Click-outside-to-close, without JS: while open, the summary grows an
    // invisible full-screen layer *under* the popover, so a click anywhere else
    // lands on the summary and toggles the calendar shut.
    `.datefield[open]>summary::before{content:"";position:fixed;inset:0;z-index:10}`,
    // Day-cell styling lives here rather than on ~400 repeated class attributes,
    // which would otherwise blow the page up to a few hundred KB.
    `.datefield .cd{display:flex;height:2.5rem;cursor:pointer;align-items:center;justify-content:center;border-radius:.375rem;font-size:.875rem;color:#52525b}`,
    `.datefield .cd:hover{background:#f4f4f5}`,
    `.datefield input:checked+.cd{background:#18181b;color:#fff;font-weight:500}`,
    `@media(prefers-color-scheme:dark){`,
    `.datefield .cd{color:#d4d4d8}`,
    `.datefield .cd:hover{background:#18181b}`,
    `.datefield input:checked+.cd{background:#fafafa;color:#18181b}`,
    `}`,
    // which month grid is on screen
    ...months.map(
      (m) =>
        `.datefield:has(#calview-${m.key}:checked) [data-month="${m.key}"]{display:block}`,
    ),
    // which date the closed field spells out
    ...allDates.map(
      (date) =>
        `.datefield:has(input[name="date"][value="${date}"]:checked) [data-date="${date}"]{display:inline}`,
    ),
  ].join("");

  const navClass =
    "flex size-11 cursor-pointer items-center justify-center rounded-md text-lg text-zinc-500 select-none hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:active:bg-zinc-800";

  return (
    <div className="block">
      <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
        Tanggal
      </span>
      <details ref={details} className="datefield relative">
        <summary
          className={`${inputClass} flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden`}
        >
          <span>
            {allDates.map((date) => (
              <span key={date} data-date={date} className="hidden">
                {readableDate(date)}
              </span>
            ))}
          </span>
          <span aria-hidden className="text-zinc-400 dark:text-zinc-500">
            &#9662;
          </span>
        </summary>

        <style>{rules}</style>

        {months.map((m) => (
          <input
            key={m.key}
            type="radio"
            name="calview"
            id={`calview-${m.key}`}
            defaultChecked={m.key === initial.slice(0, 7)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
        ))}

        <div className="absolute left-0 z-20 mt-1 w-[20rem] max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {months.map((m, index) => {
            const prev = months[index - 1];
            const next = months[index + 1];
            return (
              <div key={m.key} data-month={m.key} className="hidden">
                <div className="flex items-center justify-between pb-1">
                  {prev ? (
                    <label
                      htmlFor={`calview-${prev.key}`}
                      aria-label="Bulan sebelumnya"
                      className={navClass}
                    >
                      &#8249;
                    </label>
                  ) : (
                    <span className="size-11" />
                  )}
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                    {monthTitle(m.year, m.month)}
                  </span>
                  {next ? (
                    <label
                      htmlFor={`calview-${next.key}`}
                      aria-label="Bulan berikutnya"
                      className={navClass}
                    >
                      &#8250;
                    </label>
                  ) : (
                    <span className="size-11" />
                  )}
                </div>

                <div className="grid grid-cols-7 gap-0.5 pb-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: m.blanks }, (_, i) => (
                    <span key={`blank-${i}`} />
                  ))}
                  {Array.from({ length: m.days }, (_, i) => i + 1).map((day) => {
                    const value = `${m.key}-${pad(day)}`;
                    return (
                      <label key={value} className="block">
                        <input
                          type="radio"
                          name="date"
                          value={value}
                          required
                          defaultChecked={value === initial}
                          onChange={() => details.current?.removeAttribute("open")}
                          className="peer sr-only"
                        />
                        <span className="cd">{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function IncomeExpenseForm({
  action,
  walletId,
  categories,
  submitLabel,
  accent,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  walletId: number;
  categories: Category[];
  submitLabel: string;
  accent: "emerald" | "rose";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const buttonClass =
    accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-rose-600 hover:bg-rose-700";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="pocketId" value={walletId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Field label="Kategori">
            <select name="categoryId" defaultValue="" className={inputClass}>
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Link
            href="/settings/categories"
            className="mt-1 inline-block text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Kelola kategori
          </Link>
        </div>
        <DateField />
      </div>

      <Field label="Nominal (Rp)">
        <input
          type="number"
          name="amount"
          min={1}
          step={1}
          required
          placeholder="0"
          className={inputClass}
        />
      </Field>

      <Field label="Catatan (opsional)">
        <input
          type="text"
          name="note"
          placeholder="cth. Makan siang"
          className={inputClass}
        />
      </Field>

      {state.error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 ${buttonClass}`}
      >
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}

function TransferForm({
  walletId,
  otherWallets,
}: {
  walletId: number;
  otherWallets: Wallet[];
}) {
  const [state, formAction, pending] = useActionState(
    createTransfer,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="fromPocketId" value={walletId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ke wallet">
          <select name="toPocketId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih wallet
            </option>
            {otherWallets.map((otherWallet) => (
              <option key={otherWallet.id} value={otherWallet.id}>
                {otherWallet.name} ({formatCurrency(otherWallet.balance)})
              </option>
            ))}
          </select>
        </Field>
        <DateField />
      </div>

      <Field label="Nominal (Rp)">
        <input
          type="number"
          name="amount"
          min={1}
          step={1}
          required
          placeholder="0"
          className={inputClass}
        />
      </Field>

      <Field label="Catatan (opsional)">
        <input
          type="text"
          name="note"
          placeholder="cth. Nabung"
          className={inputClass}
        />
      </Field>

      {state.error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Menyimpan..." : "Transfer"}
      </button>
    </form>
  );
}
