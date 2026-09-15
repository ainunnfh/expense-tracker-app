"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function createPocket(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.pocket.create({ data: { name } });
  revalidatePath("/transactions");
}

export async function createIncome(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId) return { error: "Pilih kantong tujuan." };
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  await prisma.transaction.create({
    data: { type: "INCOME", amount, note, pocketId, categoryId },
  });

  revalidatePath("/transactions");
  return { error: null };
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const pocketId = parseOptionalId(formData.get("pocketId"));
  const categoryId = parseOptionalId(formData.get("categoryId"));
  const amount = parseAmount(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!pocketId) return { error: "Pilih kantong sumber." };
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  await prisma.transaction.create({
    data: { type: "EXPENSE", amount, note, pocketId, categoryId },
  });

  revalidatePath("/transactions");
  return { error: null };
}

export async function createTransfer(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fromPocketId = parseOptionalId(formData.get("fromPocketId"));
  const toPocketId = parseOptionalId(formData.get("toPocketId"));
  const amount = parseAmount(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fromPocketId || !toPocketId) {
    return { error: "Pilih kantong asal dan tujuan." };
  }
  if (fromPocketId === toPocketId) {
    return { error: "Kantong asal dan tujuan tidak boleh sama." };
  }
  if (!amount) return { error: "Nominal harus lebih besar dari 0." };

  await prisma.transaction.create({
    data: { type: "TRANSFER", amount, note, fromPocketId, toPocketId },
  });

  revalidatePath("/transactions");
  return { error: null };
}

export async function deleteTransaction(formData: FormData) {
  const id = parseOptionalId(formData.get("id"));
  if (!id) return;

  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/transactions");
}
