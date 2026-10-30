import { UpgradeCard } from "@/components/billing/UpgradeCard";

type LimitProps = {
 count: number;
 /** The plan's allowance (FREE_RECIPE_LIMIT on the free plan). */
 limit: number;
 /** Inside the iPhone app: no upgrade link or price (UpgradeCard). */
 native?: boolean;
};

/** /recipes/new once the free plan's recipes are used up. */
export function RecipeLimitReached({ count, limit, native = false }: LimitProps) {
 return (
 <div className="space-y-4">
 <UpgradeCard
 placement="recipe_limit"
 title="Recipe limit reached"
 body={
 native
 ? `You've used ${count} of ${limit} free recipes.`
 : `You've used ${count} of ${limit} free recipes. Upgrade to Pro for unlimited recipes.`
 }
 native={native}
 />
 <p className="text-center text-xs text-[var(--text-muted)]">
 {native ? "Archive recipes you don't use to free up space." : "Or archive unused recipes to free up space"}
 </p>
 </div>
 );
}

type TrialEndedProps = {
 /** For analytics: where it's shown. */
 placement: string;
 native?: boolean;
 className?: string;
};

/**
 * In place of add, import and fill once a 7-day trial has ended without
 * paying. Existing recipes stay viewable and editable.
 */
export function RecipesTrialEnded({ placement, native = false, className = "" }: TrialEndedProps) {
 return (
 <UpgradeCard
 placement={placement}
 title="Your 7-day Pro trial has ended"
 body={
 native
 ? "Your recipes are all still here to view, edit and cook. Adding new ones needs BiteSync Pro."
 : "Your recipes are all still here to view, edit and cook. Upgrade to BiteSync Pro to add, import and generate new ones."
 }
 native={native}
 className={className}
 />
 );
}
