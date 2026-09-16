import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { register } from "../actions";
import { AUTH_ERRORS } from "../errors";
import {
  AuthField,
  AuthLink,
  AuthShell,
  AuthSubmit,
  authInputClass,
} from "../auth-shell";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (await getCurrentUser()) redirect("/");

  const raw = (await searchParams).error;
  const code = Array.isArray(raw) ? raw[0] : raw;

  return (
    <AuthShell
      subtitle="Mulai catat keuanganmu"
      title="Daftar"
      error={code ? AUTH_ERRORS[code] : undefined}
      footer={
        <>
          Sudah punya akun? <AuthLink href="/login">Masuk</AuthLink>
        </>
      }
    >
      <form action={register} className="space-y-4">
        <AuthField label="Nama (opsional)">
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Nama kamu"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="kamu@email.com"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password">
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Ulangi password">
          <input
            type="password"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInputClass}
          />
        </AuthField>
        <AuthSubmit>Daftar</AuthSubmit>
      </form>
    </AuthShell>
  );
}
