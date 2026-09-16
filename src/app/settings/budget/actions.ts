"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isMonthKey, previousMonth } from "@/lib/months";
import { requireUser } from "@/lib/auth";

function revalidateBudget() {
  revalidatePath("/settings/budget");
  revalidatePath("/");
}

export async function setBudget(formData: FormData) {
  const user = await requireUser();
  const categoryId = Number(formData.get("categoryId"));
  const month = String(formData.get("month") ?? "");
  if (!Number.isInteger(categoryId) || categoryId <= 0) return;
  if (!isMonthKey(month)) return;

  const ownsCategory = await prisma.category.count({
    where: { id: categoryId, userId: user.id },
  });
  if (ownsCategory === 0) return;

  const raw = String(formData.get("amount") ?? "").trim();
  const amount = Math.round(Number(raw));

  // Blank or zero clears the target rather than storing a meaningless 0.
  if (!raw || !Number.isFinite(amount) || amount <= 0) {
    await prisma.budget.deleteMany({
      where: { categoryId, month, userId: user.id },
    });
    revalidateBudget();
    return;
  }

  await prisma.budget.upsert({
    where: { categoryId_month: { categoryId, month } },
    create: { categoryId, month, amount, userId: user.id },
    update: { amount },
  });
  revalidateBudget();
}

export async function copyBudgetFromPreviousMonth(formData: FormData) {
  const user = await requireUser();
  const month = String(formData.get("month") ?? "");
  if (!isMonthKey(month)) return;

  const source = previousMonth(month);
  const [previous, existing] = await Promise.all([
    prisma.budget.findMany({ where: { month: source, userId: user.id } }),
    prisma.budget.findMany({
      where: { month, userId: user.id },
      select: { categoryId: true },
    }),
  ]);
  if (previous.length === 0) return;

  const alreadySet = new Set(existing.map((b) => b.categoryId));
  const toCreate = previous
    .filter((b) => !alreadySet.has(b.categoryId))
    .map((b) => ({
      categoryId: b.categoryId,
      month,
      amount: b.amount,
      userId: user.id,
    }));
  if (toCreate.length === 0) return;

  await prisma.budget.createMany({ data: toCreate });
  revalidateBudget();
}
