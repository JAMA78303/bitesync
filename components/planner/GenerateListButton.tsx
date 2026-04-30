"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateGroceryList } from "@/lib/supabase/grocery";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  mealPlanId: string;
  weekStart: string;
  hasExistingList: boolean;
};

export function GenerateListButton({ mealPlanId, weekStart, hasExistingList }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleClick() {
    if (hasExistingList) setShowConfirm(true);
    else generate();
  }

  function generate() {
    startTransition(async () => {
      const result = await generateGroceryList(mealPlanId);
      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      router.push(`/grocery?week=${weekStart}&plan=${mealPlanId}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={handleClick} disabled={isPending} className="w-full gap-2 sm:w-auto">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        {isPending ? (
          "Generating..."
        ) : (
          <>
            <span className="hidden sm:inline">Generate grocery list</span>
            <span className="sm:hidden">Grocery list</span>
          </>
        )}
      </Button>

      {showConfirm && (
        <AlertDialog>
          <AlertDialogContent>
            <AlertDialogTitle>Regenerate grocery list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current list. Any items you have already checked off will be reset.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirm(false)}>Keep current list</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowConfirm(false);
                  generate();
                }}
                className="bg-[#1A4731] hover:bg-[#153928]"
              >
                Yes, regenerate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
