import Link from "next/link";

type Props = {
  current: "list" | "pantry";
};

const ITEMS = [
  { key: "list", href: "/grocery", label: "List" },
  { key: "pantry", href: "/pantry", label: "Pantry" },
] as const;

/**
 * Pantry has no tab of its own on phones: it lives here, beside the list it
 * trims. Both pages show the switch in the same place, under the title, so
 * flicking between them doesn't move it.
 */
export function GroceryPantrySwitch({ current }: Props) {
  return (
    <nav
      aria-label="Grocery list and pantry"
      className="mt-4 inline-flex rounded-full border border-white/10 bg-[var(--header-stat-bg)] p-1"
    >
      {ITEMS.map((item) => {
        const pill =
          "inline-flex min-h-10 min-w-[84px] items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors duration-150";
        // The current side isn't a link: on next week's list, "List" would
        // otherwise jump back to this week's.
        if (item.key === current) {
          return (
            <span
              key={item.key}
              aria-current="page"
              className={`${pill} bg-[var(--card-surface)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}
            >
              {item.label}
            </span>
          );
        }
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${pill} text-[var(--text-on-header-muted)] hover:text-[var(--text-on-header)]`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
