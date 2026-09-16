"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/wallets", label: "Wallet" },
  { href: "/chart", label: "Chart" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4 sm:px-6 lg:px-8">
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
      </div>
    </nav>
  );
}
