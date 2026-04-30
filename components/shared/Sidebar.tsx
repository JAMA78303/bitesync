import { NavLink } from "@/components/shared/NavLink";
import { Leaf } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-sage)]/10 text-[var(--brand-sage)]">
          <Leaf className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-xl font-semibold text-[var(--brand-sage)]">BITESYNC</p>
      </div>
      <nav className="flex flex-col gap-2">
        <NavLink href="/planner" label="Planner" icon="planner" />
        <NavLink href="/recipes" label="Recipes" icon="recipes" />
        <NavLink href="/grocery" label="Grocery" icon="grocery" />
        <NavLink href="/settings" label="Settings" icon="settings" />
      </nav>
    </aside>
  );
}
