import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function GroceryEmptyState() {
 return (
 <EmptyState
 icon={ShoppingCart}
 title="No grocery list yet"
 description="Plan meals for the week, then generate your list from the planner"
 action={{ href: "/planner", label: "Open planner" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 />
 );
}
