import { prisma } from "./prisma";

const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "INCOME" as const },
  { name: "Bonus", type: "INCOME" as const },
  { name: "Investasi", type: "INCOME" as const },
  { name: "Hadiah", type: "INCOME" as const },
  { name: "Lainnya", type: "INCOME" as const },
  { name: "Makanan", type: "EXPENSE" as const },
  { name: "Transportasi", type: "EXPENSE" as const },
  { name: "Belanja", type: "EXPENSE" as const },
  { name: "Tagihan", type: "EXPENSE" as const },
  { name: "Hiburan", type: "EXPENSE" as const },
  { name: "Kesehatan", type: "EXPENSE" as const },
  { name: "Pendidikan", type: "EXPENSE" as const },
  { name: "Lainnya", type: "EXPENSE" as const },
];

/** Gives a fresh account something to pick from on every page, not just Wallet. */
export async function seedDefaultCategories(userId: number) {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
}
