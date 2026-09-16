import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export type BalanceInput = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  pocketId: number | null;
  fromPocketId: number | null;
  toPocketId: number | null;
};

export function calculateBalances(
  pockets: { id: number }[],
  transactions: BalanceInput[],
) {
  const balances = new Map<number, number>();
  for (const pocket of pockets) balances.set(pocket.id, 0);

  for (const tx of transactions) {
    if (tx.type === "INCOME" && tx.pocketId != null) {
      balances.set(tx.pocketId, (balances.get(tx.pocketId) ?? 0) + tx.amount);
    } else if (tx.type === "EXPENSE" && tx.pocketId != null) {
      balances.set(tx.pocketId, (balances.get(tx.pocketId) ?? 0) - tx.amount);
    } else if (tx.type === "TRANSFER") {
      if (tx.fromPocketId != null) {
        balances.set(
          tx.fromPocketId,
          (balances.get(tx.fromPocketId) ?? 0) - tx.amount,
        );
      }
      if (tx.toPocketId != null) {
        balances.set(
          tx.toPocketId,
          (balances.get(tx.toPocketId) ?? 0) + tx.amount,
        );
      }
    }
  }

  return balances;
}

export async function getPocketBalance(pocketId: number, userId: number) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      OR: [{ pocketId }, { fromPocketId: pocketId }, { toPocketId: pocketId }],
    },
    select: {
      type: true,
      amount: true,
      pocketId: true,
      fromPocketId: true,
      toPocketId: true,
    },
  });

  return calculateBalances([{ id: pocketId }], transactions).get(pocketId) ?? 0;
}

export type TransactionSummary = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  note: string | null;
  date: Date;
  pocket: { name: string } | null;
  category: { name: string } | null;
  fromPocket: { name: string } | null;
  toPocket: { name: string } | null;
};

export function describeTransaction(tx: TransactionSummary) {
  const title =
    tx.type === "TRANSFER"
      ? `${tx.fromPocket?.name ?? "-"} → ${tx.toPocket?.name ?? "-"}`
      : (tx.category?.name ??
        (tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"));

  const subtitleParts: string[] = [];
  if (tx.type !== "TRANSFER" && tx.pocket) subtitleParts.push(tx.pocket.name);
  subtitleParts.push(formatDate(tx.date));
  if (tx.note) subtitleParts.push(tx.note);

  return { title, subtitle: subtitleParts.join(" · ") };
}
