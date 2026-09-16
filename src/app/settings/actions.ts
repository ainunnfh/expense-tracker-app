"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeMonthStartDay } from "@/lib/cycle";

export async function setMonthStartDay(formData: FormData) {
  const day = normalizeMonthStartDay(formData.get("monthStartDay"));

  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, monthStartDay: day },
    update: { monthStartDay: day },
  });

  // The cycle drives every page's idea of "this month".
  revalidatePath("/");
  revalidatePath("/budget");
  revalidatePath("/chart");
  revalidatePath("/settings");
}
