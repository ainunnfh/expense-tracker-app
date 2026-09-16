"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getPocketBalance } from "@/lib/transactions";

export type ActionState = {
  error: string | null;
};

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount);
}

function parseOptionalId(value: FormDataEntryValue | null) {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function revalidateWallets(...pocketIds: number[]) {
  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath("/chart");
  for (const id of pocketIds) {
    revalidatePath(`/wallets/${id}`);
  }
}

export async function createWallet(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.pocket.create({ data: { name } });
  revalidatePath("/wallets");
}

export async function createIncome(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId) return { error: "Wallet tidak ditemukan." };
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  await prisma.transaction.create({
    data: { type: "INCOME", amount, note, date, pocketId, categoryId },
  });

  revalidateWallets(pocketId);
  return { error: null };
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId) return { error: "Wallet tidak ditemukan." };
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  const balance = await getPocketBalance(pocketId);
  if (balance < amount) {
    return {
      error: `Saldo wallet tidak cukup. Saldo saat ini ${formatCurrency(balance)}.`,
    };
  }

  await prisma.transaction.create({
    data: { type: "EXPENSE", amount, note, date, pocketId, categoryId },
  });

  revalidateWallets(pocketId);
  return { error: null };
}

export async function createTransfer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fromPocketId = parseOptionalId(formData.get("fromPocketId"));
  const toPocketId = parseOptionalId(formData.get("toPocketId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fromPocketId) return { error: "Wallet asal tidak ditemukan." };
  if (!toPocketId) return { error: "Pilih wallet tujuan." };
  if (fromPocketId === toPocketId) {
    return { error: "Wallet asal dan tujuan tidak boleh sama." };
  }
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  const balance = await getPocketBalance(fromPocketId);
  if (balance < amount) {
    return {
      error: `Saldo wallet tidak cukup. Saldo saat ini ${formatCurrency(balance)}.`,
    };
  }

  await prisma.transaction.create({
    data: { type: "TRANSFER", amount, note, date, fromPocketId, toPocketId },
  });

  revalidateWallets(fromPocketId, toPocketId);
  return { error: null };
}

export async function deleteTransaction(formData: FormData) {
  const id = parseOptionalId(formData.get("id"));
  if (!id) return;

  const tx = await prisma.transaction.delete({ where: { id } });

  revalidateWallets(
    ...[tx.pocketId, tx.fromPocketId, tx.toPocketId].filter(
      (v): v is number => v != null,
    ),
  );
}
