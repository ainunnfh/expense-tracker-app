"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeMonthStartDay } from "@/lib/cycle";
import { redirect } from "next/navigation";
import {
  createSession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { MIN_PASSWORD } from "@/app/(auth)/errors";

export async function setMonthStartDay(formData: FormData) {
  const user = await requireUser();
  const day = normalizeMonthStartDay(formData.get("monthStartDay"));

  const existing = await prisma.setting.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    await prisma.setting.update({
      where: { id: existing.id },
      data: { monthStartDay: day },
    });
  } else {
    await prisma.setting.create({
      data: { monthStartDay: day, userId: user.id },
    });
  }

  // The cycle drives every page's idea of "this month".
  revalidatePath("/");
  revalidatePath("/settings/budget");
  revalidatePath("/chart");
  revalidatePath("/settings");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    redirect("/settings?pw=wrong");
  }
  if (next.length < MIN_PASSWORD) redirect("/settings?pw=short");
  if (next !== confirm) redirect("/settings?pw=mismatch");
  if (next === current) redirect("/settings?pw=same");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  // Signs out every other device, then re-issues a session for this one.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);

  redirect("/settings?pw=ok");
}
