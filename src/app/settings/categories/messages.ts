export const MAX_CATEGORY_NAME = 30;

/** Feedback travels as a code in the URL so it shows without any JS. */
export const CATEGORY_MESSAGES: Record<
  string,
  { text: string; tone: "ok" | "error" }
> = {
  added: { text: "Kategori ditambahkan.", tone: "ok" },
  renamed: { text: "Nama kategori diperbarui.", tone: "ok" },
  deleted: { text: "Kategori dihapus.", tone: "ok" },
  empty: { text: "Nama kategori tidak boleh kosong.", tone: "error" },
  long: {
    text: `Nama kategori maksimal ${MAX_CATEGORY_NAME} karakter.`,
    tone: "error",
  },
  duplicate: {
    text: "Sudah ada kategori dengan nama dan jenis yang sama.",
    tone: "error",
  },
};