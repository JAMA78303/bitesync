export type PriceVolatility = "low" | "medium" | "high";

export type CanonicalItem = {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  common_allergens: string[];
};

export type BasketIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type StoreProduct = {
  id: string;
  store: string;
  product_name: string;
  canonical_item_id: string | null;
  price_gbp: number;
  unit_price_gbp: number;
  size_value: number;
  size_unit: string;
  /** Smallest purchasable pack (same unit as recipe quantities when pack pricing applies). */
  min_purchase_size?: number | null;
  min_purchase_unit?: string | null;
  /** Price for one min purchase unit (typically equals shelf price for that pack). */
  min_purchase_price?: number | null;
  confidence: number;
  price_volatility: PriceVolatility;
  last_seen_at: string;
};

export type StoreItemEstimate = {
  ingredientName: string;
  /** Recipe line qty/unit for display (e.g. store comparison labels). */
  quantity?: number;
  unit?: string;
  canonicalItemId: string | null;
  store: string;
  estimatedCost: number;
  confidence: number;
  freshnessDays: number;
  priceVolatility: PriceVolatility;
  /** Short note when whole-pack pricing applies (e.g. multiple packs). */
  displayNote?: string;
};

export type StoreTotal = {
  store: string;
  total: number;
  weightedConfidence: number;
  freshnessDays: number;
  certainty: number;
  estimateRange: number;
};

export type SubstitutionSuggestion = {
  fromItem: string;
  toItem: string;
  reason: string;
  estimatedSavings: number;
  nutritionNote: string;
  confidence: number;
};

export type GoalContext = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  followsVegetarian: boolean;
  followsVegan: boolean;
  followsGlutenFree: boolean;
  dairyFree?: boolean;
  allergens?: string[];
  budgetCapGbp?: number;
};
