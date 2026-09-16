export const MIN_PASSWORD = 8;

/** Errors travel as a code in the URL so the message shows without any JS. */
export const AUTH_ERRORS: Record<string, string> = {
  email: "Email tidak valid.",
  short: `Password minimal ${MIN_PASSWORD} karakter.`,
  mismatch: "Konfirmasi password tidak cocok.",
  taken: "Email ini sudah terdaftar.",
  credentials: "Email atau password salah.",
};
