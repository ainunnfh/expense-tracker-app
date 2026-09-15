"use client";

import { useActionState, useState, type ReactNode } from "react";
import { createExpense, createIncome, createTransfer, type ActionState } from "./actions";

const initialState: ActionState = { error: null };

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600";

type Pocket = { id: number; name: string };
type Category = { id: number; name: string };
type Tab = "income" | "expense" | "transfer";

export function TransactionForm({
  pockets,
  incomeCategories,
  expenseCategories,
}: {
  pockets: Pocket[];
  incomeCategories: Category[];
  expenseCategories: Category[];
}) {
  const [tab, setTab] = useState<Tab>("expense");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <TabButton active={tab === "income"} onClick={() => setTab("income")}>
          Pemasukan
        </TabButton>
        <TabButton active={tab === "expense"} onClick={() => setTab("expense")}>
          Pengeluaran
        </TabButton>
        <TabButton active={tab === "transfer"} onClick={() => setTab("transfer")}>
          Transfer
        </TabButton>
      </div>

      <div className="p-4 sm:p-5">
        {pockets.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Tambahkan kantong terlebih dahulu sebelum mencatat transaksi.
          </p>
        ) : tab === "income" ? (
          <IncomeExpenseForm
            key="income"
            action={createIncome}
            pockets={pockets}
            categories={incomeCategories}
            pocketLabel="Kantong tujuan"
            submitLabel="Simpan Pemasukan"
            accent="emerald"
          />
        ) : tab === "expense" ? (
          <IncomeExpenseForm
            key="expense"
            action={createExpense}
            pockets={pockets}
            categories={expenseCategories}
            pocketLabel="Kantong sumber"
            submitLabel="Simpan Pengeluaran"
            accent="rose"
          />
        ) : (
          <TransferForm pockets={pockets} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 border-b-2 border-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
          : "flex-1 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }
    >
      {children}
    </button>
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
  pockets,
  categories,
  pocketLabel,
  submitLabel,
  accent,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  pockets: Pocket[];
  categories: Category[];
  pocketLabel: string;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={pocketLabel}>
          <select name="pocketId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih kantong
            </option>
            {pockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))}
          </select>
        </Field>
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

function TransferForm({ pockets }: { pockets: Pocket[] }) {
  const [state, formAction, pending] = useActionState(
    createTransfer,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Dari kantong">
          <select name="fromPocketId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih kantong
            </option>
            {pockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ke kantong">
          <select name="toPocketId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih kantong
            </option>
            {pockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))}
          </select>
        </Field>
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
