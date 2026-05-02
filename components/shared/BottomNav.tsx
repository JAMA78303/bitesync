import { NavLink } from "@/components/shared/NavLink";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-gray-200 bg-white px-0.5 py-2 md:hidden [&_a]:text-[10px] [&_a]:leading-tight sm:[&_a]:text-xs">
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
        <NavLink href="/billing" label="Billing" icon="billing" compact />
      </div>
      <div className="flex justify-center">
        <NavLink href="/settings" label="Settings" icon="settings" compact />
      </div>
    </nav>
  );
}
