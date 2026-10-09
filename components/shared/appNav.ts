import {
  BarChart2,
  CalendarDays,
  Home,
  Leaf,
  Package,
  Settings,
  ShoppingBasket,
  Target,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = { href: string; label: string; Icon: LucideIcon };

/** Sidebar (desktop): every destination, in the order people use them. */
export const SIDEBAR_ITEMS: AppNavItem[] = [
  { href: "/today", label: "Today", Icon: Home },
  { href: "/planner", label: "Planner", Icon: CalendarDays },
  { href: "/recipes", label: "Recipes", Icon: Leaf },
  { href: "/grocery", label: "Grocery", Icon: ShoppingBasket },
  { href: "/pantry", label: "Pantry", Icon: Package },
  { href: "/nutrition", label: "Nutrition", Icon: BarChart2 },
  { href: "/goals", label: "Goals", Icon: Target },
];

export const SETTINGS_ITEM: AppNavItem = { href: "/settings", label: "Settings", Icon: Settings };

/** Title shown in the desktop top bar, by route. */
export function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/recipes/")) return "Recipe";
  if (pathname.startsWith("/goals/targets")) return "Targets";
  if (pathname.startsWith("/goals/dietary")) return "Dietary preferences";
  const titles: Record<string, string> = {
    "/today": "Today",
    "/planner": "Planner",
    "/recipes": "Recipes",
    "/grocery": "Grocery list",
    "/pantry": "Pantry",
    "/nutrition": "Nutrition",
    "/goals": "Goals",
    "/settings": "Settings",
    "/billing": "Billing",
    "/sample-week": "Sample week",
    "/feedback": "Feedback",
  };
  const root = `/${pathname.split("/")[1] ?? ""}`;
  return titles[root] ?? "BiteSync";
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
