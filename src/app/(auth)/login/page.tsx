import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { login } from "../actions";
import { AUTH_ERRORS } from "../errors";
import {
  AuthField,
  AuthLink,
  AuthShell,
  AuthSubmit,
  authInputClass,
} from "../auth-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (await getCurrentUser()) redirect("/");

  const raw = (await searchParams).error;
  const code = Array.isArray(raw) ? raw[0] : raw;

  return (
    <AuthShell
      subtitle="Selamat datang kembali"
      title="Masuk"
      error={code ? AUTH_ERRORS[code] : undefined}
      footer={
        <>
          Belum punya akun? <AuthLink href="/register">Daftar</AuthLink>
        </>
      }
    >
      <form action={login} className="space-y-4">
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
            autoComplete="current-password"
            className={authInputClass}
          />
        </AuthField>
        <AuthSubmit>Masuk</AuthSubmit>
      </form>
    </AuthShell>
  );
}
