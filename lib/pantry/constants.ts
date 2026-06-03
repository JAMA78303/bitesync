export type PantryItemRow = {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string;
  running_low: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export const PANTRY_STAPLES = [
  "olive oil",
  "salt",
  "pepper",
  "eggs",
  "rice",
  "pasta",
  "onion",
  "garlic",
  "milk",
  "butter",
  "flour",
  "chicken breast",
  "tinned tomatoes",
  "potatoes",
  "bread",
] as const;
