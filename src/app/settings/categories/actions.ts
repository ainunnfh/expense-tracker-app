"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MAX_CATEGORY_NAME } from "./messages";

const PAGE = "/settings/categories";

function revalidateCategories() {
  revalidatePath(PAGE);
  revalidatePath("/wallets");
  revalidatePath("/settings/budget");
  revalidatePath("/chart");
}

function readName(formData: FormData) {
  return String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function readType(formData: FormData) {
  return formData.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
}

export async function createCategory(formData: FormData) {
  const user = await requireUser();
  const name = readName(formData);
  const type = readType(formData);

  if (!name) redirect(`${PAGE}?msg=empty`);
  if (name.length > MAX_CATEGORY_NAME) redirect(`${PAGE}?msg=long`);

  const clash = await prisma.category.count({
    where: { userId: user.id, name, type },
  });
  if (clash > 0) redirect(`${PAGE}?msg=duplicate`);

  await prisma.category.create({ data: { name, type, userId: user.id } });
  revalidateCategories();
  redirect(`${PAGE}?msg=added`);
}

export async function renameCategory(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const name = readName(formData);
  if (!Number.isInteger(id) || id <= 0) return;

  const category = await prisma.category.findFirst({
    where: { id, userId: user.id },
    select: { id: true, type: true, name: true },
  });
  if (!category) return;
  if (!name) redirect(`${PAGE}?msg=empty`);
  if (name.length > MAX_CATEGORY_NAME) redirect(`${PAGE}?msg=long`);
  if (name === category.name) redirect(PAGE);

  const clash = await prisma.category.count({
    where: { userId: user.id, name, type: category.type, id: { not: id } },
  });
  if (clash > 0) redirect(`${PAGE}?msg=duplicate`);

  await prisma.category.update({ where: { id: category.id }, data: { name } });
  revalidateCategories();
  redirect(`${PAGE}?msg=renamed`);
}

export async function deleteCategory(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const category = await prisma.category.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!category) return;

  // Transactions keep their amounts and fall back to "Tanpa Kategori";
  // budgets for this category go with it.
  await prisma.category.delete({ where: { id: category.id } });
  revalidateCategories();
  redirect(`${PAGE}?msg=deleted`);
}
