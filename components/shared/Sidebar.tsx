import { NavLink } from "@/components/shared/NavLink";
import { Logo } from "@/components/shared/Logo";

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white p-4 md:flex">
      <Logo size="md" href="/planner" className="mb-6" />
      <nav className="flex flex-col gap-2">
        <NavLink href="/planner" label="Planner" icon="planner" />
        <NavLink href="/recipes" label="Recipes" icon="recipes" />
        <NavLink href="/grocery" label="Grocery" icon="grocery" />
        <NavLink href="/nutrition" label="Nutrition" icon="nutrition" />
        <NavLink href="/settings" label="Settings" icon="settings" />
      </nav>
    </aside>
  );
}
