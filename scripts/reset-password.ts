import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { MIN_PASSWORD } from "../src/app/(auth)/errors";

/** Collects every line of a piped stdin in one pass. */
async function readPipedLines() {
  let buffer = "";
  for await (const chunk of process.stdin) buffer += chunk;
  return buffer.split(/\r?\n/);
}

/**
 * Asks twice for the new password. A terminal gets hidden prompts; piped input
 * is read in a single pass, because a second readline question over a pipe can
 * wait forever for input that has already been consumed.
 */
async function readNewPassword(email: string): Promise<[string, string]> {
  if (!process.stdin.isTTY) {
    const [password = "", confirm = ""] = await readPipedLines();
    return [password, confirm];
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const output = process.stdout as NodeJS.WriteStream & { muted?: boolean };
  const write = output.write.bind(output);
  output.write = ((chunk: string, ...rest: unknown[]) =>
    output.muted ? true : write(chunk, ...(rest as []))) as typeof output.write;

  const hidden = async (question: string) => {
    write(question);
    output.muted = true;
    try {
      return await rl.question("");
    } finally {
      output.muted = false;
      write("\n");
    }
  };

  try {
    return [
      await hidden(`Password baru untuk ${email}: `),
      await hidden("Ulangi password baru: "),
    ];
  } finally {
    output.write = write;
    rl.close();
  }
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { id: "asc" },
  });

  if (users.length === 0) {
    console.log("Belum ada akun. Daftar dulu lewat halaman /register.");
    return;
  }

  if (!email) {
    console.log("Pakai: npm run reset-password -- <email>\n\nAkun terdaftar:");
    for (const u of users) {
      console.log(`  - ${u.email}${u.name ? ` (${u.name})` : ""}`);
    }
    return;
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    console.log(`Akun "${email}" tidak ditemukan.`);
    return;
  }

  const [password, confirm] = await readNewPassword(user.email);

  if (password.length < MIN_PASSWORD) {
    console.log(`Gagal: password minimal ${MIN_PASSWORD} karakter.`);
    return;
  }
  if (password !== confirm) {
    console.log("Gagal: konfirmasi tidak cocok.");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });
  const killed = await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(
    `Password ${user.email} berhasil diganti. ${killed.count} sesi lama dikeluarkan.`,
  );
}

main()
  .catch((error) => {
    console.error("Gagal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
