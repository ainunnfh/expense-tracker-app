"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./(auth)/actions";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/wallets", label: "Wallet" },
  { href: "/chart", label: "Chart" },
  { href: "/settings", label: "Setelan" },
];

export function Nav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-1 px-4 sm:px-6 lg:px-8">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "border-b-2 border-zinc-900 px-3 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-b-2 border-transparent px-3 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }
            >
              {link.label}
            </Link>
          );
        })}

        <form action={logout} className="ml-auto flex items-center gap-2 py-2">
          <span
            title={email}
            className="hidden max-w-32 truncate text-xs text-zinc-400 sm:inline dark:text-zinc-500"
          >
            {email}
          </span>
          <button
            type="submit"
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Keluar
          </button>
        </form>
      </div>
    </nav>
  );
}
