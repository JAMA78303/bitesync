import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function GroceryEmptyState() {
 return (
 <EmptyState
 icon={ShoppingCart}
 title="No grocery list yet"
 description="Add meals to your planner and generate your list"
 action={{ href: "/planner", label: "Go to planner" }}
 />
 );
}
