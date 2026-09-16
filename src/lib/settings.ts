import { cache } from "react";
import { prisma } from "./prisma";
import { normalizeMonthStartDay } from "./cycle";

/** Cached per request so every section of a page agrees on the cycle. */
export const getMonthStartDay = cache(async (userId: number) => {
  const setting = await prisma.setting.findFirst({ where: { userId } });
  return normalizeMonthStartDay(setting?.monthStartDay ?? 1);
});
