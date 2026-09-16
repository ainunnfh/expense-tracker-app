"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { MIN_PASSWORD } from "./errors";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim() || null,
  };
}

/**
 * Data created before accounts existed has userId = null. The first account to
 * register adopts it, so the wallets and transactions already in the app stay
 * usable instead of becoming unreachable.
 */
async function claimOrphanData(userId: number) {
  if ((await prisma.user.count()) !== 1) return;

  await prisma.$transaction([
    prisma.pocket.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.category.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.transaction.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.budget.updateMany({ where: { userId: null }, data: { userId } }),
    prisma.setting.updateMany({ where: { userId: null }, data: { userId } }),
  ]);
}

export async function register(formData: FormData) {
  const { email, password, name } = readCredentials(formData);

  if (!email.includes("@") || email.length < 3) redirect("/register?error=email");
  if (password.length < MIN_PASSWORD) redirect("/register?error=short");
  if (password !== String(formData.get("confirm") ?? "")) {
    redirect("/register?error=mismatch");
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    redirect("/register?error=taken");
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
    select: { id: true },
  });

  await claimOrphanData(user.id);
  await createSession(user.id);
  redirect("/");
}

export async function login(formData: FormData) {
  const { email, password } = readCredentials(formData);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // One message for both cases, so the form can't be used to discover emails.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=credentials");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
