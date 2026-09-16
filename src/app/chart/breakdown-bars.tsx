import { formatCurrency } from "@/lib/format";

export type BreakdownItem = {
  name: string;
  amount: number;
};

const SLOT_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
];
const FALLBACK_COLOR = { light: "#898781", dark: "#898781" };

function colorFor(name: string, index: number) {
  return name === "Lainnya" || name.startsWith("Tanpa ")
    ? FALLBACK_COLOR
    : SLOT_COLORS[index % SLOT_COLORS.length];
}

export function BreakdownBars({
  items,
  emptyLabel,
}: {
  items: BreakdownItem[];
  emptyLabel: string;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
        <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {emptyLabel}
        </p>
      </div>
    );
  }

  const maxAmount = Math.max(...items.map((item) => item.amount));
  const darkVars = items
    .map((item, i) => `--cat-${i}:${colorFor(item.name, i).dark};`)
    .join("");

  return (
    <div
      className="breakdown-bars rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
      style={Object.fromEntries(
        items.map((item, i) => [`--cat-${i}`, colorFor(item.name, i).light]),
      )}
    >
      <ul className="space-y-3">
        {items.map((item, i) => {
          const widthPct = (item.amount / maxAmount) * 100;
          const sharePct = Math.round((item.amount / total) * 100);

          return (
            <li key={item.name}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-zinc-700 dark:text-zinc-300">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--cat-${i})` }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(item.amount)}{" "}
                  <span className="font-normal text-zinc-400 dark:text-zinc-500">
                    {sharePct}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: `var(--cat-${i})` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <style>
        {`@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .breakdown-bars { ${darkVars} }
}
:root[data-theme="dark"] .breakdown-bars { ${darkVars} }`}
      </style>
    </div>
  );
}
