import type { MealVisualType } from "@/lib/ui/mealVisuals";
import { mealTintClasses, resolveMealVisual } from "@/lib/ui/mealVisuals";

type Props = {
  recipeName: string;
  mealType?: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  imageAlt?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
  md: "h-14 w-14 rounded-xl [&_svg]:h-6 [&_svg]:w-6",
  lg: "h-24 w-24 rounded-2xl [&_svg]:h-10 [&_svg]:w-10",
} as const;

export function MealThumbnail({
  recipeName,
  mealType = "dinner",
  imageUrl,
  size = "md",
  className = "",
  imageAlt,
}: Props) {
  const visual = resolveMealVisual(recipeName, mealType);
  const tint = mealTintClasses(visual.mealType as MealVisualType);
  const { Icon } = visual;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${sizeClasses[size]} ${tint} ${className}`.trim()}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={imageAlt ?? ""} className="h-full w-full object-cover" />
      ) : (
        <Icon aria-hidden strokeWidth={2} />
      )}
    </div>
  );
}
