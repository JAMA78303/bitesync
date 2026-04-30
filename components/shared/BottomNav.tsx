import { NavLink } from "@/components/shared/NavLink";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-gray-200 bg-white px-1 py-2 md:hidden">
      <div className="flex justify-center">
        <NavLink href="/planner" label="Planner" icon="planner" compact />
      </div>
      <div className="flex justify-center">
        <NavLink href="/recipes" label="Recipes" icon="recipes" compact />
      </div>
      <div className="flex justify-center">
        <NavLink href="/grocery" label="Grocery" icon="grocery" compact />
      </div>
      <div className="flex justify-center">
        <NavLink href="/settings" label="Settings" icon="settings" compact />
      </div>
    </nav>
  );
}
