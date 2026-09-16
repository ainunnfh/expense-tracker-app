import {
  MAX_MONTH_START_DAY,
  cycleContaining,
  cycleRangeLabel,
  cycleTitle,
} from "@/lib/cycle";
import { getMonthStartDay } from "@/lib/settings";
import { requireUser } from "@/lib/auth";
import { changePassword, setMonthStartDay } from "./actions";
import { PASSWORD_MESSAGES } from "./messages";

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const rawPw = (await searchParams).pw;
  const pwCode = Array.isArray(rawPw) ? rawPw[0] : rawPw;
  const pwMessage = pwCode ? PASSWORD_MESSAGES[pwCode] : undefined;
  const monthStartDay = await getMonthStartDay(user.id);
  const now = new Date();
  const current = cycleContaining(now, monthStartDay);

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="mb-6 sm:mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sesuaikan aplikasi dengan caramu
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Setelan
          </h1>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Awal bulan
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Kalau kamu gajian tanggal 25, pilih 25 — satu bulan dihitung dari
            gajian ke gajian, bukan dari tanggal 1. Ini dipakai di Dashboard,
            Chart, dan Budget.
          </p>

          <form action={setMonthStartDay} className="mt-4 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="monthStartDay">
              Tanggal mulai bulan
            </label>
            <select
              id="monthStartDay"
              name="monthStartDay"
              defaultValue={String(monthStartDay)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {Array.from({ length: MAX_MONTH_START_DAY }, (_, i) => i + 1).map(
                (day) => (
                  <option key={day} value={day}>
                    Tanggal {day}
                  </option>
                ),
              )}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Simpan
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              Periode berjalan sekarang
            </p>
            <p className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">
              {cycleTitle(current)}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {cycleRangeLabel(current)}
            </p>
          </div>

          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Maksimal tanggal {MAX_MONTH_START_DAY}, supaya tanggalnya selalu ada
            di setiap bulan termasuk Februari.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Ganti password
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Masuk sebagai <span className="font-medium">{user.email}</span>.
            Setelah diganti, perangkat lain yang masih masuk akan otomatis
            keluar.
          </p>

          {pwMessage ? (
            <p
              role="status"
              className={
                pwMessage.tone === "ok"
                  ? "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : "mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              }
            >
              {pwMessage.text}
            </p>
          ) : null}

          <form action={changePassword} className="mt-4 max-w-sm space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
                Password saat ini
              </span>
              <input
                type="password"
                name="current"
                required
                autoComplete="current-password"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
                Password baru
              </span>
              <input
                type="password"
                name="next"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
                Ulangi password baru
              </span>
              <input
                type="password"
                name="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Ganti password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
