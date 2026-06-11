/** Extract numbered method steps from a recipe description (import / AI / legacy). */
export function parseRecipeSteps(description: string | null | undefined): string[] {
  if (!description?.trim()) return [];
  const text = description.trim();
  const methodIdx = text.search(/\nMethod\n/i);
  const block = methodIdx >= 0 ? text.slice(methodIdx + "\nMethod\n".length) : text;
  const lines = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const steps: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\d+[.)]\s*(.+)$/);
    if (m?.[1]) steps.push(m[1].trim());
  }
  return steps;
}

export function recipeIntroFromDescription(description: string | null | undefined): string {
  if (!description?.trim()) return "";
  const methodIdx = description.search(/\nMethod\n/i);
  if (methodIdx < 0) return description.trim();
  return description.slice(0, methodIdx).trim();
}
