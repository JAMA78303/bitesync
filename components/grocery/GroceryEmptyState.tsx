import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function GroceryEmptyState() {
 return (
 <EmptyState
 icon={ShoppingCart}
 title="No grocery list yet"
 description="Generate a list from your planner — or finish setup to get one automatically"
 action={{ href: "/onboarding", label: "Finish setup" }}
 secondaryAction={{ href: "/sample-week", label: "See a sample week" }}
 />
 );
}
