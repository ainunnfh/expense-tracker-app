import { cache } from "react";
import { prisma } from "./prisma";
import { normalizeMonthStartDay } from "./cycle";

/** Cached per request so every section of a page agrees on the cycle. */
export const getMonthStartDay = cache(async () => {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return normalizeMonthStartDay(setting?.monthStartDay ?? 1);
});
