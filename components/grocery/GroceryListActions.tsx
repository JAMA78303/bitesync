"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { deleteGroceryList } from "@/lib/supabase/grocery-actions";
import { clearOfflineGroceryList, isNativeApp, saveOfflineGroceryList, shareNative } from "@/lib/native/bridge";
import { getMonday, toLocalISO } from "@/lib/utils/dates";
import type { MealType } from "@/types";
import { ds } from "@/lib/ui/classes";

type Props = {
 mealPlanId: string;
 weekStart: string;
 filledDays: number[];
 filledMealTypes: MealType[];
 /** Plain-text list of what's still to buy; no Share button when there's nothing. */
 shareText?: string | null;
 /** Items on the list, ticked or not; 0 means there's no list to keep offline. */
 itemCount?: number;
 /**
  * Making a list from the plan (Edit list). False once a 7-day trial has
  * ended (lib/billing/access.ts: canPlan); sharing and deleting stay.
  */
 canGenerate?: boolean;
};

export function GroceryListActions({
 mealPlanId,
 weekStart,
 filledDays,
 filledMealTypes,
 shareText,
 itemCount = 0,
 canGenerate = true,
}: Props) {
 const [showSelector, setShowSelector] = useState(false);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [isPending, startTransition] = useTransition();
 const { toast } = useToast();
 const router = useRouter();

 // In the iPhone app, keep the latest list on the phone for the offline page
 // (native/www/offline.html), so it still opens in a shop with no signal.
 // Only this week's or a later list, and only one that has items.
 useEffect(() => {
 if (itemCount === 0 || weekStart < toLocalISO(getMonday(new Date()))) return;
 saveOfflineGroceryList(shareText ?? null, weekStart).catch(() => {});
 }, [shareText, itemCount, weekStart]);

 /**
 * The phone's share sheet where there is one (WhatsApp, Messages, Notes…);
 * otherwise copy, so it can be pasted anywhere. Cancelling the sheet is not
 * an error.
 */
 async function handleShare() {
 if (!shareText) return;
 if (isNativeApp()) {
 try {
 await shareNative("Grocery list", shareText);
 return;
 } catch {
 // The sheet couldn't open; copy instead.
 }
 } else if (typeof navigator.share === "function") {
 try {
 await navigator.share({ title: "Grocery list", text: shareText });
 return;
 } catch (err) {
 if (err instanceof DOMException && err.name === "AbortError") return;
 }
 }
 try {
 await navigator.clipboard.writeText(shareText);
 toast({ title: "Grocery list copied", description: "Paste it into a message, a note or an email." });
 } catch {
 toast({ title: "Couldn't share the list", description: "Your browser blocked it. Try again.", variant: "destructive" });
 }
 }

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteGroceryList(mealPlanId);
 if (result?.error) {
 toast({ title:"Failed to delete list", description: result.error, variant:"destructive" });
 return;
 }
 setShowDeleteConfirm(false);
 toast({ title:"Grocery list deleted" });
 clearOfflineGroceryList(weekStart).catch(() => {});
 router.refresh();
 });
 }

 return (
 <>
 <div className="flex flex-wrap items-center gap-2.5">
 {shareText ? (
 <button type="button" className={`${ds.heroPrimaryBtn} w-full sm:w-auto`} onClick={() => void handleShare()}>
 <Share2 className="h-4 w-4" aria-hidden />
 Share list
 </button>
 ) : null}
 {canGenerate ? (
 <button type="button" className={`${ds.heroGhostBtn} flex-1 sm:flex-none`} onClick={() => setShowSelector(true)}>
 <Pencil className="h-3.5 w-3.5" aria-hidden />
 Edit list
 </button>
 ) : null}
 <button type="button" className={`${ds.heroGhostBtn} flex-1 sm:flex-none`} onClick={() => setShowDeleteConfirm(true)}>
 <Trash2 className="h-3.5 w-3.5" aria-hidden />
 Delete list
 </button>
 </div>

 {canGenerate ? (
 <DaySelectorModal
 open={showSelector}
 onClose={() => setShowSelector(false)}
 mealPlanId={mealPlanId}
 weekStart={weekStart}
 filledDays={filledDays}
 filledMealTypes={filledMealTypes}
 />
 ) : null}

 {showDeleteConfirm ? (
 <AlertDialog>
 <AlertDialogContent>
 <AlertDialogTitle>Delete this grocery list?</AlertDialogTitle>
 <AlertDialogDescription>
 {canGenerate
 ?"This removes all current grocery items for this week. You can regenerate it anytime."
 :"This removes all current grocery items for this week."}
 </AlertDialogDescription>
 <AlertDialogFooter>
 <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleDelete}
 disabled={isPending}
 className="bg-[var(--traffic-red)] hover:bg-[var(--traffic-red)]/90"
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
