/** Feedback travels as a code in the URL so it shows without any JS. */
export const PASSWORD_MESSAGES: Record<
  string,
  { text: string; tone: "ok" | "error" }
> = {
  ok: { text: "Password berhasil diganti.", tone: "ok" },
  wrong: { text: "Password saat ini salah.", tone: "error" },
  short: { text: "Password baru minimal 8 karakter.", tone: "error" },
  mismatch: { text: "Konfirmasi password baru tidak cocok.", tone: "error" },
  same: { text: "Password baru sama dengan yang lama.", tone: "error" },
};
