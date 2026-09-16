"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isMonthKey, previousMonth } from "@/lib/months";

function revalidateBudget() {
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function setBudget(formData: FormData) {
  const categoryId = Number(formData.get("categoryId"));
  const month = String(formData.get("month") ?? "");
  if (!Number.isInteger(categoryId) || categoryId <= 0) return;
  if (!isMonthKey(month)) return;

  const raw = String(formData.get("amount") ?? "").trim();
  const amount = Math.round(Number(raw));

  // Blank or zero clears the target rather than storing a meaningless 0.
  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    await prisma.budget.deleteMany({ where: { categoryId, month } });
    revalidateBudget();
    return;
  }

  await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month } },
    create: { categoryId, month, amount },
    update: { amount },
  });
  revalidateBudget();
}

export async function copyBudgetFromPreviousMonth(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  if (!isMonthKey(month)) return;

  const source = previousMonth(month);
  const [previous, existing] = await Promise.all([
    prisma.budget.findMany({ where: { month: source } }),
    prisma.budget.findMany({ where: { month }, select: { categoryId: true } }),
  ]);
  if (previous.length === 0) return;

  const alreadySet = new Set(existing.map((b) => b.categoryId));
  const toCreate = previous
    .filter((b) => !alreadySet.has(b.categoryId))
    .map((b) => ({ categoryId: b.categoryId, month, amount: b.amount }));
  if (toCreate.length === 0) return;

  await prisma.budget.createMany({ data: toCreate });
  revalidateBudget();
}
