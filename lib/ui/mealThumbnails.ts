export const MEAL_THUMBNAILS: Record<string, string> = {
  oats: "🥣",
  eggs: "🍳",
  toast: "🍞",
  smoothie: "🥤",
  yogurt: "🫙",
  yoghurt: "🫙",
  pancakes: "🥞",
  default_breakfast: "☀️",

  salad: "🥗",
  sandwich: "🥪",
  soup: "🍲",
  wrap: "🌯",
  default_lunch: "🕛",

  chicken: "🍗",
  pasta: "🍝",
  rice: "🍚",
  fish: "🐟",
  steak: "🥩",
  curry: "🍛",
  burger: "🍔",
  default_dinner: "🍽️",

  fruit: "🍎",
  nuts: "🥜",
  default_snack: "🍌",
};

export function getMealEmoji(recipeName: string, mealType: string): string {
  const name = recipeName.toLowerCase();
  for (const [key, emoji] of Object.entries(MEAL_THUMBNAILS)) {
    if (key.startsWith("default_")) continue;
    if (name.includes(key)) return emoji;
  }
  return MEAL_THUMBNAILS[`default_${mealType}`] ?? "🍽️";
}
