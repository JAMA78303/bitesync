"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DaySelectorModal } from "@/components/planner/DaySelectorModal";
import { useToast } from "@/components/ui/use-toast";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteGroceryList } from "@/lib/supabase/grocery";
import type { MealType } from "@/types";

type Props = {
 mealPlanId: string;
 weekStart: string;
 filledDays: number[];
 filledMealTypes: MealType[];
};

export function GroceryListActions({ mealPlanId, weekStart, filledDays, filledMealTypes }: Props) {
 const [showSelector, setShowSelector] = useState(false);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [isPending, startTransition] = useTransition();
 const { toast } = useToast();
 const router = useRouter();

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteGroceryList(mealPlanId);
 if (result?.error) {
 toast({ title:"Failed to delete list", description: result.error, variant:"destructive" });
 return;
 }
 setShowDeleteConfirm(false);
 toast({ title:"Grocery list deleted" });
 router.refresh();
 });
 }

 return (
 <>
 <div className="flex items-center gap-2">
 <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowSelector(true)}>
 <Pencil className="mr-1.5 h-3.5 w-3.5" />
 Edit list
 </Button>
 <Button type="button" variant="outline" className="h-8 text-xs text-red-600" onClick={() => setShowDeleteConfirm(true)}>
 <Trash2 className="mr-1.5 h-3.5 w-3.5" />
 Delete
 </Button>
 </div>

 <DaySelectorModal
 open={showSelector}
 onClose={() => setShowSelector(false)}
 mealPlanId={mealPlanId}
 weekStart={weekStart}
 filledDays={filledDays}
 filledMealTypes={filledMealTypes}
 />

 {showDeleteConfirm ? (
 <AlertDialog>
 <AlertDialogContent>
 <AlertDialogTitle>Delete this grocery list?</AlertDialogTitle>
 <AlertDialogDescription>This removes all current grocery items for this week. You can regenerate it anytime.</AlertDialogDescription>
 <AlertDialogFooter>
 <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleDelete}
 disabled={isPending}
 className="bg-red-600 hover:bg-red-700"
 >
 {isPending ?"Deleting..." :"Delete list"}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 ) : null}
 </>
 );
}
