"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getPocketBalance } from "@/lib/transactions";
import { requireUser } from "@/lib/auth";

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

async function ownsPocket(userId: number, pocketId: number) {
  return (await prisma.pocket.count({ where: { id: pocketId, userId } })) > 0;
}

/** Drops a category id that isn't the user's, rather than trusting the form. */
async function ownedCategoryId(userId: number, categoryId: number | null) {
  if (!categoryId) return null;
  const owned = await prisma.category.count({ where: { id: categoryId, userId } });
  return owned > 0 ? categoryId : null;
}

function revalidateWallets(...pocketIds: number[]) {
  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath("/chart");
  revalidatePath("/budget");
  for (const id of pocketIds) {
    revalidatePath(`/wallets/${id}`);
  }
}

export async function createWallet(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.pocket.create({ data: { name, userId: user.id } });
  revalidatePath("/wallets");
}

export async function createIncome(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId || !(await ownsPocket(user.id, pocketId))) {
    return { error: "Wallet tidak ditemukan." };
  }
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  await prisma.transaction.create({
    data: {
      type: "INCOME",
      amount,
      note,
      date,
      pocketId,
      categoryId: await ownedCategoryId(user.id, categoryId),
      userId: user.id,
    },
  });

  revalidateWallets(pocketId);
  return { error: null };
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId || !(await ownsPocket(user.id, pocketId))) {
    return { error: "Wallet tidak ditemukan." };
  }
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  const balance = await getPocketBalance(pocketId, user.id);
  if (balance < amount) {
    return {
      error: `Saldo wallet tidak cukup. Saldo saat ini ${formatCurrency(balance)}.`,
    };
  }

  await prisma.transaction.create({
    data: {
      type: "EXPENSE",
      amount,
      note,
      date,
      pocketId,
      categoryId: await ownedCategoryId(user.id, categoryId),
      userId: user.id,
    },
  });

  revalidateWallets(pocketId);
  return { error: null };
}

export async function createTransfer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const fromPocketId = parseOptionalId(formData.get("fromPocketId"));
  const toPocketId = parseOptionalId(formData.get("toPocketId"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fromPocketId || !(await ownsPocket(user.id, fromPocketId))) {
    return { error: "Wallet asal tidak ditemukan." };
  }
  if (!toPocketId || !(await ownsPocket(user.id, toPocketId))) {
    return { error: "Pilih wallet tujuan." };
  }
  if (fromPocketId === toPocketId) {
    return { error: "Wallet asal dan tujuan tidak boleh sama." };
  }
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  const balance = await getPocketBalance(fromPocketId, user.id);
  if (balance < amount) {
    return {
      error: `Saldo wallet tidak cukup. Saldo saat ini ${formatCurrency(balance)}.`,
    };
  }

  await prisma.transaction.create({
    data: {
      type: "TRANSFER",
      amount,
      note,
      date,
      fromPocketId,
      toPocketId,
      userId: user.id,
    },
  });

  revalidateWallets(fromPocketId, toPocketId);
  return { error: null };
}

export async function deleteTransaction(formData: FormData) {
  const user = await requireUser();
  const id = parseOptionalId(formData.get("id"));
  if (!id) return;

  // Scoped delete: a foreign id simply matches nothing.
  const tx = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });
  if (!tx) return;
  await prisma.transaction.delete({ where: { id: tx.id } });

  revalidateWallets(
    ...[tx.pocketId, tx.fromPocketId, tx.toPocketId].filter(
      (v): v is number => v != null,
    ),
  );
}
