/** Pill styles for auto diet tags — neutral labels; colour reserved for meal-type tints and status. */
export function getDietTagStyle(_tag: string): string {
  return "border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)]";
}

export const STORE_COLORS: Record<string, string> = {
  Tesco: "#00539f",
  Asda: "#68a51c",
  Aldi: "#00005f",
};
