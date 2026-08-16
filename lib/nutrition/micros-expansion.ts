import type { MicroEntry } from "@/lib/nutrition/micros";

/**
 * Micronutrient DB expansion — common UK whole foods missing from the base MICRO_DB.
 * Values are per 100 g as typically eaten, approximated from COFID (McCance &
 * Widdowson) and USDA reference data, consistent in style with the base entries.
 * The weekly analysis silently drops unmatched ingredients, so every entry here
 * directly reduces under-reporting of vitamin and mineral intake.
 */
export const MICRO_DB_EXPANSION: Record<string, MicroEntry> = {
  // --- Meat & poultry ---
  "pork chop": {
    vitamin_a_mcg: 2, vitamin_c_mg: 0, vitamin_d_mcg: 0.8, vitamin_b12_mcg: 0.7,
    folate_mcg: 3, iron_mg: 0.8, calcium_mg: 8, zinc_mg: 2.1, magnesium_mg: 24,
    potassium_mg: 380, selenium_mcg: 38, iodine_mcg: 3, saturated_fat_g: 2.5, salt_g: 0.2, sugar_g: 0,
  },
  "lamb chop": {
    vitamin_a_mcg: 8, vitamin_c_mg: 0, vitamin_d_mcg: 0.6, vitamin_b12_mcg: 2.5,
    folate_mcg: 3, iron_mg: 1.8, calcium_mg: 10, zinc_mg: 3.5, magnesium_mg: 22,
    potassium_mg: 310, selenium_mcg: 8, iodine_mcg: 3, saturated_fat_g: 7, salt_g: 0.2, sugar_g: 0,
  },
  "beef steak": {
    vitamin_a_mcg: 3, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 2.4,
    folate_mcg: 6, iron_mg: 2.3, calcium_mg: 6, zinc_mg: 4.3, magnesium_mg: 22,
    potassium_mg: 350, selenium_mcg: 14, iodine_mcg: 6, saturated_fat_g: 3, salt_g: 0.2, sugar_g: 0,
  },
  chorizo: {
    vitamin_a_mcg: 15, vitamin_c_mg: 0, vitamin_d_mcg: 0.9, vitamin_b12_mcg: 1.3,
    folate_mcg: 2, iron_mg: 1.6, calcium_mg: 12, zinc_mg: 2.4, magnesium_mg: 18,
    potassium_mg: 400, selenium_mcg: 21, iodine_mcg: 3, saturated_fat_g: 12, salt_g: 3, sugar_g: 1,
  },
  salami: {
    vitamin_a_mcg: 8, vitamin_c_mg: 0, vitamin_d_mcg: 0.8, vitamin_b12_mcg: 1.5,
    folate_mcg: 2, iron_mg: 1.3, calcium_mg: 10, zinc_mg: 2.5, magnesium_mg: 17,
    potassium_mg: 340, selenium_mcg: 17, iodine_mcg: 3, saturated_fat_g: 12, salt_g: 3.5, sugar_g: 0.5,
  },
  "duck breast": {
    vitamin_a_mcg: 24, vitamin_c_mg: 3, vitamin_d_mcg: 0.9, vitamin_b12_mcg: 3,
    folate_mcg: 10, iron_mg: 2.4, calcium_mg: 5, zinc_mg: 1.9, magnesium_mg: 19,
    potassium_mg: 270, selenium_mcg: 14, iodine_mcg: 4, saturated_fat_g: 1.3, salt_g: 0.2, sugar_g: 0,
  },
  "chicken liver": {
    vitamin_a_mcg: 9700, vitamin_c_mg: 18, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 17,
    folate_mcg: 590, iron_mg: 9, calcium_mg: 8, zinc_mg: 2.7, magnesium_mg: 19,
    potassium_mg: 230, selenium_mcg: 68, iodine_mcg: 7, saturated_fat_g: 1.6, salt_g: 0.2, sugar_g: 0,
  },
  "chicken drumstick": {
    vitamin_a_mcg: 18, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.4,
    folate_mcg: 7, iron_mg: 1, calcium_mg: 10, zinc_mg: 2.1, magnesium_mg: 20,
    potassium_mg: 240, selenium_mcg: 18, iodine_mcg: 3, saturated_fat_g: 2.7, salt_g: 0.2, sugar_g: 0,
  },
  "chicken wings": {
    vitamin_a_mcg: 30, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.4,
    folate_mcg: 5, iron_mg: 0.9, calcium_mg: 13, zinc_mg: 1.8, magnesium_mg: 18,
    potassium_mg: 190, selenium_mcg: 20, iodine_mcg: 3, saturated_fat_g: 4.5, salt_g: 0.3, sugar_g: 0,
  },
  "corned beef": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.4, vitamin_b12_mcg: 1.6,
    folate_mcg: 6, iron_mg: 2.4, calcium_mg: 12, zinc_mg: 3.9, magnesium_mg: 14,
    potassium_mg: 130, selenium_mcg: 26, iodine_mcg: 4, saturated_fat_g: 5, salt_g: 2.3, sugar_g: 0,
  },
  // --- Fish & seafood ---
  "sea bass": {
    vitamin_a_mcg: 30, vitamin_c_mg: 0, vitamin_d_mcg: 5, vitamin_b12_mcg: 2,
    folate_mcg: 8, iron_mg: 0.4, calcium_mg: 15, zinc_mg: 0.5, magnesium_mg: 40,
    potassium_mg: 300, selenium_mcg: 36, iodine_mcg: 25, saturated_fat_g: 0.7, salt_g: 0.2, sugar_g: 0,
  },
  tilapia: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 3.1, vitamin_b12_mcg: 1.6,
    folate_mcg: 6, iron_mg: 0.6, calcium_mg: 10, zinc_mg: 0.3, magnesium_mg: 27,
    potassium_mg: 300, selenium_mcg: 42, iodine_mcg: 6, saturated_fat_g: 0.8, salt_g: 0.1, sugar_g: 0,
  },
  mussels: {
    vitamin_a_mcg: 54, vitamin_c_mg: 8, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 12,
    folate_mcg: 42, iron_mg: 3.9, calcium_mg: 26, zinc_mg: 1.6, magnesium_mg: 34,
    potassium_mg: 268, selenium_mcg: 45, iodine_mcg: 140, saturated_fat_g: 0.4, salt_g: 0.7, sugar_g: 0,
  },
  trout: {
    vitamin_a_mcg: 16, vitamin_c_mg: 0.5, vitamin_d_mcg: 4.7, vitamin_b12_mcg: 4.5,
    folate_mcg: 12, iron_mg: 0.7, calcium_mg: 43, zinc_mg: 0.7, magnesium_mg: 22,
    potassium_mg: 360, selenium_mcg: 13, iodine_mcg: 13, saturated_fat_g: 1.2, salt_g: 0.1, sugar_g: 0,
  },
  anchovies: {
    vitamin_a_mcg: 12, vitamin_c_mg: 0, vitamin_d_mcg: 11, vitamin_b12_mcg: 0.9,
    folate_mcg: 13, iron_mg: 3.3, calcium_mg: 232, zinc_mg: 2.4, magnesium_mg: 69,
    potassium_mg: 544, selenium_mcg: 37, iodine_mcg: 30, saturated_fat_g: 2.2, salt_g: 9.2, sugar_g: 0,
  },
  // --- Dairy & eggs ---
  "single cream": {
    vitamin_a_mcg: 180, vitamin_c_mg: 1, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.3,
    folate_mcg: 4, iron_mg: 0.1, calcium_mg: 89, zinc_mg: 0.3, magnesium_mg: 8,
    potassium_mg: 120, selenium_mcg: 1, iodine_mcg: 22, saturated_fat_g: 12, salt_g: 0.1, sugar_g: 3,
  },
  "double cream": {
    vitamin_a_mcg: 550, vitamin_c_mg: 1, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 0.2,
    folate_mcg: 3, iron_mg: 0.1, calcium_mg: 49, zinc_mg: 0.2, magnesium_mg: 5,
    potassium_mg: 77, selenium_mcg: 1, iodine_mcg: 16, saturated_fat_g: 30, salt_g: 0.1, sugar_g: 2.6,
  },
  "creme fraiche": {
    vitamin_a_mcg: 300, vitamin_c_mg: 0.5, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.2,
    folate_mcg: 6, iron_mg: 0.1, calcium_mg: 76, zinc_mg: 0.3, magnesium_mg: 7,
    potassium_mg: 110, selenium_mcg: 1, iodine_mcg: 20, saturated_fat_g: 20, salt_g: 0.1, sugar_g: 2.9,
  },
  brie: {
    vitamin_a_mcg: 240, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 1.7,
    folate_mcg: 58, iron_mg: 0.5, calcium_mg: 256, zinc_mg: 2.2, magnesium_mg: 15,
    potassium_mg: 100, selenium_mcg: 12, iodine_mcg: 20, saturated_fat_g: 18, salt_g: 1.6, sugar_g: 0.5,
  },
  camembert: {
    vitamin_a_mcg: 230, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 1.1,
    folate_mcg: 60, iron_mg: 0.3, calcium_mg: 350, zinc_mg: 2.7, magnesium_mg: 18,
    potassium_mg: 100, selenium_mcg: 12, iodine_mcg: 20, saturated_fat_g: 15, salt_g: 1.5, sugar_g: 0.5,
  },
  "blue cheese": {
    vitamin_a_mcg: 280, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 1.2,
    folate_mcg: 50, iron_mg: 0.3, calcium_mg: 500, zinc_mg: 2.5, magnesium_mg: 20,
    potassium_mg: 90, selenium_mcg: 5, iodine_mcg: 25, saturated_fat_g: 19, salt_g: 2, sugar_g: 0.5,
  },
  mascarpone: {
    vitamin_a_mcg: 390, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.2,
    folate_mcg: 4, iron_mg: 0.1, calcium_mg: 68, zinc_mg: 0.4, magnesium_mg: 6,
    potassium_mg: 60, selenium_mcg: 2, iodine_mcg: 15, saturated_fat_g: 29, salt_g: 0.1, sugar_g: 3,
  },
  "fromage frais": {
    vitamin_a_mcg: 55, vitamin_c_mg: 0.5, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.5,
    folate_mcg: 12, iron_mg: 0.1, calcium_mg: 110, zinc_mg: 0.5, magnesium_mg: 10,
    potassium_mg: 150, selenium_mcg: 2, iodine_mcg: 25, saturated_fat_g: 4.4, salt_g: 0.1, sugar_g: 4,
  },
  paneer: {
    vitamin_a_mcg: 210, vitamin_c_mg: 0, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 0.8,
    folate_mcg: 15, iron_mg: 0.2, calcium_mg: 480, zinc_mg: 2.2, magnesium_mg: 20,
    potassium_mg: 100, selenium_mcg: 9, iodine_mcg: 25, saturated_fat_g: 15, salt_g: 0.1, sugar_g: 2.6,
  },
  quark: {
    vitamin_a_mcg: 10, vitamin_c_mg: 0.5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.7,
    folate_mcg: 24, iron_mg: 0.1, calcium_mg: 95, zinc_mg: 0.5, magnesium_mg: 10,
    potassium_mg: 130, selenium_mcg: 3, iodine_mcg: 30, saturated_fat_g: 0.2, salt_g: 0.1, sugar_g: 4,
  },
  "egg yolk": {
    vitamin_a_mcg: 380, vitamin_c_mg: 0, vitamin_d_mcg: 5.4, vitamin_b12_mcg: 2,
    folate_mcg: 145, iron_mg: 2.7, calcium_mg: 130, zinc_mg: 2.3, magnesium_mg: 5,
    potassium_mg: 110, selenium_mcg: 56, iodine_mcg: 140, saturated_fat_g: 9.5, salt_g: 0.1, sugar_g: 0.6,
  },
  // --- Grains, breads & bakery ---
  "plain flour": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 31, iron_mg: 2, calcium_mg: 140, zinc_mg: 0.6, magnesium_mg: 20,
    potassium_mg: 130, selenium_mcg: 4, iodine_mcg: 1, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 0.7,
  },
  "wholemeal flour": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 57, iron_mg: 3.9, calcium_mg: 38, zinc_mg: 2.9, magnesium_mg: 120,
    potassium_mg: 340, selenium_mcg: 53, iodine_mcg: 1, saturated_fat_g: 0.3, salt_g: 0, sugar_g: 1.7,
  },
  "flour tortilla": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 50, iron_mg: 2.2, calcium_mg: 130, zinc_mg: 0.7, magnesium_mg: 22,
    potassium_mg: 130, selenium_mcg: 11, iodine_mcg: 1, saturated_fat_g: 1.8, salt_g: 1.1, sugar_g: 2.5,
  },
  sourdough: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 40, iron_mg: 1.6, calcium_mg: 45, zinc_mg: 0.9, magnesium_mg: 27,
    potassium_mg: 120, selenium_mcg: 15, iodine_mcg: 2, saturated_fat_g: 0.4, salt_g: 1.1, sugar_g: 1.8,
  },
  bagel: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 55, iron_mg: 2.8, calcium_mg: 90, zinc_mg: 1, magnesium_mg: 25,
    potassium_mg: 110, selenium_mcg: 20, iodine_mcg: 2, saturated_fat_g: 0.4, salt_g: 1.1, sugar_g: 5,
  },
  crumpet: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 25, iron_mg: 1.2, calcium_mg: 100, zinc_mg: 0.5, magnesium_mg: 15,
    potassium_mg: 100, selenium_mcg: 8, iodine_mcg: 2, saturated_fat_g: 0.2, salt_g: 1.5, sugar_g: 1.5,
  },
  "english muffin": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 45, iron_mg: 2.3, calcium_mg: 100, zinc_mg: 0.8, magnesium_mg: 22,
    potassium_mg: 110, selenium_mcg: 14, iodine_mcg: 2, saturated_fat_g: 0.5, salt_g: 1, sugar_g: 2,
  },
  ciabatta: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 38, iron_mg: 1.5, calcium_mg: 30, zinc_mg: 0.8, magnesium_mg: 25,
    potassium_mg: 120, selenium_mcg: 17, iodine_mcg: 2, saturated_fat_g: 0.7, salt_g: 1.2, sugar_g: 1.5,
  },
  "pitta bread": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 40, iron_mg: 1.6, calcium_mg: 50, zinc_mg: 0.8, magnesium_mg: 26,
    potassium_mg: 120, selenium_mcg: 18, iodine_mcg: 2, saturated_fat_g: 0.2, salt_g: 1, sugar_g: 2,
  },
  naan: {
    vitamin_a_mcg: 10, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.1,
    folate_mcg: 35, iron_mg: 1.5, calcium_mg: 80, zinc_mg: 0.8, magnesium_mg: 25,
    potassium_mg: 140, selenium_mcg: 14, iodine_mcg: 4, saturated_fat_g: 1.5, salt_g: 1.2, sugar_g: 3.5,
  },
  "pearl barley": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 20, iron_mg: 2.5, calcium_mg: 20, zinc_mg: 2.1, magnesium_mg: 65,
    potassium_mg: 270, selenium_mcg: 3, iodine_mcg: 1, saturated_fat_g: 0.4, salt_g: 0, sugar_g: 0.8,
  },
  "egg noodles": {
    vitamin_a_mcg: 5, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.1,
    folate_mcg: 26, iron_mg: 1.2, calcium_mg: 20, zinc_mg: 0.9, magnesium_mg: 30,
    potassium_mg: 100, selenium_mcg: 20, iodine_mcg: 3, saturated_fat_g: 0.6, salt_g: 0.3, sugar_g: 0.5,
  },
  "rice noodles": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 4, iron_mg: 0.2, calcium_mg: 5, zinc_mg: 0.4, magnesium_mg: 10,
    potassium_mg: 20, selenium_mcg: 8, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0.1, sugar_g: 0.1,
  },
  muesli: {
    vitamin_a_mcg: 1, vitamin_c_mg: 0.5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 45, iron_mg: 3.5, calcium_mg: 60, zinc_mg: 2.2, magnesium_mg: 100,
    potassium_mg: 440, selenium_mcg: 10, iodine_mcg: 5, saturated_fat_g: 1.2, salt_g: 0.1, sugar_g: 16,
  },
  "bran flakes": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 4.2, vitamin_b12_mcg: 1.9,
    folate_mcg: 250, iron_mg: 12, calcium_mg: 40, zinc_mg: 2.5, magnesium_mg: 130,
    potassium_mg: 500, selenium_mcg: 5, iodine_mcg: 3, saturated_fat_g: 0.4, salt_g: 0.9, sugar_g: 18,
  },
  breadcrumbs: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 50, iron_mg: 2.5, calcium_mg: 120, zinc_mg: 1, magnesium_mg: 30,
    potassium_mg: 160, selenium_mcg: 20, iodine_mcg: 2, saturated_fat_g: 0.7, salt_g: 1.2, sugar_g: 4,
  },
  cornflour: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 0, iron_mg: 0.5, calcium_mg: 2, zinc_mg: 0.1, magnesium_mg: 3,
    potassium_mg: 10, selenium_mcg: 1, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0,
  },
  "shortcrust pastry": {
    vitamin_a_mcg: 60, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0,
    folate_mcg: 20, iron_mg: 1.4, calcium_mg: 80, zinc_mg: 0.5, magnesium_mg: 14,
    potassium_mg: 90, selenium_mcg: 4, iodine_mcg: 4, saturated_fat_g: 12, salt_g: 0.9, sugar_g: 1.5,
  },
  "puff pastry": {
    vitamin_a_mcg: 10, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0,
    folate_mcg: 20, iron_mg: 1.3, calcium_mg: 60, zinc_mg: 0.5, magnesium_mg: 13,
    potassium_mg: 80, selenium_mcg: 4, iodine_mcg: 2, saturated_fat_g: 11, salt_g: 0.9, sugar_g: 1.5,
  },
  // --- Vegetables ---
  ginger: {
    vitamin_a_mcg: 0, vitamin_c_mg: 5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 11, iron_mg: 0.6, calcium_mg: 16, zinc_mg: 0.3, magnesium_mg: 43,
    potassium_mg: 415, selenium_mcg: 0.7, iodine_mcg: 0, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 1.7,
  },
  pumpkin: {
    vitamin_a_mcg: 426, vitamin_c_mg: 9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 16, iron_mg: 0.8, calcium_mg: 21, zinc_mg: 0.3, magnesium_mg: 12,
    potassium_mg: 340, selenium_mcg: 0.3, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 2.8,
  },
  parsnip: {
    vitamin_a_mcg: 0, vitamin_c_mg: 17, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 67, iron_mg: 0.6, calcium_mg: 36, zinc_mg: 0.6, magnesium_mg: 29,
    potassium_mg: 375, selenium_mcg: 2, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 4.8,
  },
  turnip: {
    vitamin_a_mcg: 0, vitamin_c_mg: 21, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 15, iron_mg: 0.3, calcium_mg: 30, zinc_mg: 0.3, magnesium_mg: 11,
    potassium_mg: 190, selenium_mcg: 0.7, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 3.8,
  },
  swede: {
    vitamin_a_mcg: 0, vitamin_c_mg: 25, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 21, iron_mg: 0.4, calcium_mg: 47, zinc_mg: 0.2, magnesium_mg: 23,
    potassium_mg: 305, selenium_mcg: 0.7, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.5,
  },
  radish: {
    vitamin_a_mcg: 0, vitamin_c_mg: 15, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 25, iron_mg: 0.3, calcium_mg: 25, zinc_mg: 0.3, magnesium_mg: 10,
    potassium_mg: 233, selenium_mcg: 0.6, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 1.9,
  },
  watercress: {
    vitamin_a_mcg: 160, vitamin_c_mg: 43, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 45, iron_mg: 2.2, calcium_mg: 120, zinc_mg: 0.7, magnesium_mg: 15,
    potassium_mg: 230, selenium_mcg: 0.9, iodine_mcg: 2, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 0.5,
  },
  "pak choi": {
    vitamin_a_mcg: 223, vitamin_c_mg: 45, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 66, iron_mg: 0.8, calcium_mg: 105, zinc_mg: 0.2, magnesium_mg: 19,
    potassium_mg: 252, selenium_mcg: 0.5, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.2, sugar_g: 1.2,
  },
  "mange tout": {
    vitamin_a_mcg: 54, vitamin_c_mg: 60, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 42, iron_mg: 2.1, calcium_mg: 43, zinc_mg: 0.3, magnesium_mg: 24,
    potassium_mg: 200, selenium_mcg: 0.7, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 4,
  },
  chard: {
    vitamin_a_mcg: 306, vitamin_c_mg: 30, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 14, iron_mg: 1.8, calcium_mg: 51, zinc_mg: 0.4, magnesium_mg: 81,
    potassium_mg: 379, selenium_mcg: 0.9, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.5, sugar_g: 1.1,
  },
  fennel: {
    vitamin_a_mcg: 7, vitamin_c_mg: 12, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 27, iron_mg: 0.7, calcium_mg: 49, zinc_mg: 0.2, magnesium_mg: 17,
    potassium_mg: 414, selenium_mcg: 0.7, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 3.9,
  },
  "brussels sprouts": {
    vitamin_a_mcg: 38, vitamin_c_mg: 85, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 61, iron_mg: 1.4, calcium_mg: 42, zinc_mg: 0.4, magnesium_mg: 23,
    potassium_mg: 389, selenium_mcg: 1.6, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 2.2,
  },
  lettuce: {
    vitamin_a_mcg: 166, vitamin_c_mg: 9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 73, iron_mg: 0.9, calcium_mg: 36, zinc_mg: 0.2, magnesium_mg: 13,
    potassium_mg: 194, selenium_mcg: 0.6, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 1.2,
  },
  "spring onion": {
    vitamin_a_mcg: 50, vitamin_c_mg: 19, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 64, iron_mg: 1.5, calcium_mg: 72, zinc_mg: 0.4, magnesium_mg: 20,
    potassium_mg: 276, selenium_mcg: 0.6, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 2.3,
  },
  "tomato puree": {
    vitamin_a_mcg: 76, vitamin_c_mg: 22, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 12, iron_mg: 3, calcium_mg: 36, zinc_mg: 0.6, magnesium_mg: 42,
    potassium_mg: 1014, selenium_mcg: 5, iodine_mcg: 2, saturated_fat_g: 0.1, salt_g: 0.2, sugar_g: 12,
  },
  passata: {
    vitamin_a_mcg: 44, vitamin_c_mg: 15, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 13, iron_mg: 1, calcium_mg: 18, zinc_mg: 0.3, magnesium_mg: 20,
    potassium_mg: 439, selenium_mcg: 1, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 4.5,
  },
  olives: {
    vitamin_a_mcg: 20, vitamin_c_mg: 0.9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 3, iron_mg: 3.3, calcium_mg: 88, zinc_mg: 0.2, magnesium_mg: 4,
    potassium_mg: 8, selenium_mcg: 1, iodine_mcg: 1, saturated_fat_g: 1.4, salt_g: 3.5, sugar_g: 0,
  },
  // --- Fruit ---
  apricot: {
    vitamin_a_mcg: 96, vitamin_c_mg: 10, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 9, iron_mg: 0.4, calcium_mg: 13, zinc_mg: 0.2, magnesium_mg: 10,
    potassium_mg: 259, selenium_mcg: 0.1, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 9.2,
  },
  blackberries: {
    vitamin_a_mcg: 11, vitamin_c_mg: 21, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 25, iron_mg: 0.6, calcium_mg: 29, zinc_mg: 0.5, magnesium_mg: 20,
    potassium_mg: 162, selenium_mcg: 0.4, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.9,
  },
  cherries: {
    vitamin_a_mcg: 3, vitamin_c_mg: 7, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 4, iron_mg: 0.4, calcium_mg: 13, zinc_mg: 0.1, magnesium_mg: 11,
    potassium_mg: 222, selenium_mcg: 0, iodine_mcg: 0.5, saturated_fat_g: 0, salt_g: 0, sugar_g: 12.8,
  },
  fig: {
    vitamin_a_mcg: 7, vitamin_c_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 6, iron_mg: 0.4, calcium_mg: 35, zinc_mg: 0.2, magnesium_mg: 17,
    potassium_mg: 232, selenium_mcg: 0.2, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 16.3,
  },
  dates: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 15, iron_mg: 1, calcium_mg: 64, zinc_mg: 0.4, magnesium_mg: 54,
    potassium_mg: 696, selenium_mcg: 0.3, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 66,
  },
  raisins: {
    vitamin_a_mcg: 0, vitamin_c_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 5, iron_mg: 1.9, calcium_mg: 50, zinc_mg: 0.2, magnesium_mg: 32,
    potassium_mg: 749, selenium_mcg: 0.6, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 59,
  },
  rhubarb: {
    vitamin_a_mcg: 5, vitamin_c_mg: 8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 7, iron_mg: 0.2, calcium_mg: 86, zinc_mg: 0.1, magnesium_mg: 12,
    potassium_mg: 288, selenium_mcg: 1.1, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 1.1,
  },
  blackcurrants: {
    vitamin_a_mcg: 12, vitamin_c_mg: 181, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 8, iron_mg: 1.5, calcium_mg: 55, zinc_mg: 0.3, magnesium_mg: 24,
    potassium_mg: 322, selenium_mcg: 0.4, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 6.6,
  },
  melon: {
    vitamin_a_mcg: 169, vitamin_c_mg: 37, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 21, iron_mg: 0.2, calcium_mg: 9, zinc_mg: 0.2, magnesium_mg: 12,
    potassium_mg: 267, selenium_mcg: 0.4, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 7.9,
  },
  pomegranate: {
    vitamin_a_mcg: 0, vitamin_c_mg: 10, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 38, iron_mg: 0.3, calcium_mg: 10, zinc_mg: 0.4, magnesium_mg: 12,
    potassium_mg: 236, selenium_mcg: 0.5, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 13.7,
  },
  // --- Condiments, sauces & store-cupboard ---
  mayonnaise: {
    vitamin_a_mcg: 65, vitamin_c_mg: 0, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 0.1,
    folate_mcg: 5, iron_mg: 0.3, calcium_mg: 10, zinc_mg: 0.2, magnesium_mg: 1,
    potassium_mg: 20, selenium_mcg: 2, iodine_mcg: 4, saturated_fat_g: 6, salt_g: 1.5, sugar_g: 1.5,
  },
  mustard: {
    vitamin_a_mcg: 5, vitamin_c_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 12, iron_mg: 1.6, calcium_mg: 60, zinc_mg: 0.6, magnesium_mg: 49,
    potassium_mg: 152, selenium_mcg: 33, iodine_mcg: 1, saturated_fat_g: 0.3, salt_g: 2.8, sugar_g: 3,
  },
  "maple syrup": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 0, iron_mg: 0.1, calcium_mg: 102, zinc_mg: 1.5, magnesium_mg: 21,
    potassium_mg: 212, selenium_mcg: 0.6, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 60,
  },
  ketchup: {
    vitamin_a_mcg: 26, vitamin_c_mg: 4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 9, iron_mg: 0.4, calcium_mg: 15, zinc_mg: 0.2, magnesium_mg: 13,
    potassium_mg: 281, selenium_mcg: 0.7, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 1.8, sugar_g: 22,
  },
  pesto: {
    vitamin_a_mcg: 90, vitamin_c_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.2,
    folate_mcg: 20, iron_mg: 1, calcium_mg: 220, zinc_mg: 1, magnesium_mg: 30,
    potassium_mg: 150, selenium_mcg: 3, iodine_mcg: 5, saturated_fat_g: 7, salt_g: 2.5, sugar_g: 3,
  },
  "balsamic vinegar": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 0, iron_mg: 0.7, calcium_mg: 27, zinc_mg: 0.1, magnesium_mg: 12,
    potassium_mg: 112, selenium_mcg: 0.5, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 15,
  },
  marmite: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 24,
    folate_mcg: 1250, iron_mg: 4, calcium_mg: 90, zinc_mg: 1, magnesium_mg: 160,
    potassium_mg: 2100, selenium_mcg: 5, iodine_mcg: 2, saturated_fat_g: 0, salt_g: 10.8, sugar_g: 1,
  },
  "nutritional yeast": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 44,
    folate_mcg: 1960, iron_mg: 4, calcium_mg: 30, zinc_mg: 7.8, magnesium_mg: 140,
    potassium_mg: 1900, selenium_mcg: 25, iodine_mcg: 1, saturated_fat_g: 0.6, salt_g: 0.1, sugar_g: 2,
  },
  "miso paste": {
    vitamin_a_mcg: 4, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.1,
    folate_mcg: 19, iron_mg: 2.5, calcium_mg: 57, zinc_mg: 2.6, magnesium_mg: 48,
    potassium_mg: 210, selenium_mcg: 7, iodine_mcg: 2, saturated_fat_g: 1.1, salt_g: 9.1, sugar_g: 6.2,
  },
  "dark chocolate": {
    vitamin_a_mcg: 2, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.3,
    folate_mcg: 12, iron_mg: 11.9, calcium_mg: 73, zinc_mg: 3.3, magnesium_mg: 228,
    potassium_mg: 715, selenium_mcg: 7, iodine_mcg: 3, saturated_fat_g: 24, salt_g: 0.1, sugar_g: 24,
  },
  "orange juice": {
    vitamin_a_mcg: 10, vitamin_c_mg: 39, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 18, iron_mg: 0.2, calcium_mg: 10, zinc_mg: 0.1, magnesium_mg: 10,
    potassium_mg: 179, selenium_mcg: 0.1, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 8.4,
  },
  "apple juice": {
    vitamin_a_mcg: 0, vitamin_c_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 0, iron_mg: 0.1, calcium_mg: 7, zinc_mg: 0, magnesium_mg: 4,
    potassium_mg: 95, selenium_mcg: 0.1, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 9.6,
  },
  // --- Herbs & spices (high per-100g density; typical use is a few grams) ---
  cumin: {
    vitamin_a_mcg: 64, vitamin_c_mg: 8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 10, iron_mg: 66, calcium_mg: 931, zinc_mg: 4.8, magnesium_mg: 366,
    potassium_mg: 1788, selenium_mcg: 5, iodine_mcg: 1, saturated_fat_g: 1.5, salt_g: 0.4, sugar_g: 2.3,
  },
  paprika: {
    vitamin_a_mcg: 2463, vitamin_c_mg: 0.9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 49, iron_mg: 21, calcium_mg: 229, zinc_mg: 4.3, magnesium_mg: 178,
    potassium_mg: 2280, selenium_mcg: 6, iodine_mcg: 1, saturated_fat_g: 2.1, salt_g: 0.2, sugar_g: 10,
  },
  turmeric: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0.7, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 20, iron_mg: 55, calcium_mg: 168, zinc_mg: 4.4, magnesium_mg: 208,
    potassium_mg: 2080, selenium_mcg: 6, iodine_mcg: 1, saturated_fat_g: 1.8, salt_g: 0.1, sugar_g: 3.2,
  },
  cinnamon: {
    vitamin_a_mcg: 15, vitamin_c_mg: 3.8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 6, iron_mg: 8.3, calcium_mg: 1002, zinc_mg: 1.8, magnesium_mg: 60,
    potassium_mg: 431, selenium_mcg: 3, iodine_mcg: 1, saturated_fat_g: 0.3, salt_g: 0, sugar_g: 2.2,
  },
  parsley: {
    vitamin_a_mcg: 421, vitamin_c_mg: 133, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 152, iron_mg: 6.2, calcium_mg: 138, zinc_mg: 1.1, magnesium_mg: 50,
    potassium_mg: 554, selenium_mcg: 0.1, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0.1, sugar_g: 0.9,
  },
  coriander: {
    vitamin_a_mcg: 337, vitamin_c_mg: 27, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 62, iron_mg: 1.8, calcium_mg: 67, zinc_mg: 0.5, magnesium_mg: 26,
    potassium_mg: 521, selenium_mcg: 0.9, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 0.9,
  },
  basil: {
    vitamin_a_mcg: 264, vitamin_c_mg: 18, vitamin_d_mcg: 0, vitamin_b12_mcg: 0,
    folate_mcg: 68, iron_mg: 3.2, calcium_mg: 177, zinc_mg: 0.8, magnesium_mg: 64,
    potassium_mg: 295, selenium_mcg: 0.3, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 0.3,
  },
};

/** Name variants that resolve to base or expansion entries. */
export const MICRO_ALIAS_EXPANSION: Record<string, string> = {
  "pork chops": "pork chop",
  "lamb chops": "lamb chop",
  "sirloin steak": "beef steak",
  "ribeye steak": "beef steak",
  "rump steak": "beef steak",
  "beef strips": "beef steak",
  "bacon rashers": "bacon",
  "streaky bacon": "bacon",
  "back bacon": "bacon",
  "ham slices": "ham",
  "turkey slices": "turkey breast",
  "chicken slices": "chicken breast",
  "chicken thighs": "chicken thigh",
  "chicken drumsticks": "chicken drumstick",
  "cod fillet": "cod",
  "sea bass fillet": "sea bass",
  prawns: "shrimp",
  "king prawns": "shrimp",
  "canned tuna in oil": "tuna canned",
  cream: "single cream",
  "sour cream": "creme fraiche",
  "soured cream": "creme fraiche",
  stilton: "blue cheese",
  "egg yolks": "egg yolk",
  "garlic cloves": "garlic",
  "garlic clove": "garlic",
  leeks: "leek",
  beets: "beetroot",
  parsnips: "parsnip",
  radishes: "radish",
  "fennel bulb": "fennel",
  "fine beans": "green beans",
  "spring greens": "kale",
  "spring onions": "spring onion",
  "salad leaves": "lettuce",
  "romaine lettuce": "lettuce",
  "iceberg lettuce": "lettuce",
  "little gem": "lettuce",
  sweetcorn: "corn",
  "frozen mixed veg": "peas",
  "peas frozen": "peas",
  "sweetcorn frozen": "corn",
  "tortilla wrap": "flour tortilla",
  tortilla: "flour tortilla",
  wrap: "flour tortilla",
  wraps: "flour tortilla",
  "bagel plain": "bagel",
  bagels: "bagel",
  crumpets: "crumpet",
  "english muffins": "english muffin",
  "panko breadcrumbs": "breadcrumbs",
  "bread crumbs fresh": "breadcrumbs",
  "corn starch": "cornflour",
  "barley pearl": "pearl barley",
  noodles: "egg noodles",
  "pesto jar green": "pesto",
  "pesto jar red": "pesto",
  "tomato ketchup": "ketchup",
  "tahini paste": "tahini",
  "miso paste white": "miso paste",
  "miso paste red": "miso paste",
  "nutritional yeast flakes": "nutritional yeast",
  "brewers yeast flakes": "nutritional yeast",
  apricots: "apricot",
  nectarine: "peach",
  nectarines: "peach",
  figs: "fig",
  sultanas: "raisins",
  currants: "raisins",
  "mixed berries": "blueberries",
  redcurrants: "blackcurrants",
  gooseberries: "blackcurrants",
  cantaloupe: "melon",
  "honeydew melon": "melon",
  "olives green jar": "olives",
  "olives black jar": "olives",
  "green olives": "olives",
  "black olives": "olives",
  "mayonnaise light": "mayonnaise",
  "mayonnaise full fat": "mayonnaise",
  "mustard dijon": "mustard",
  "dijon mustard": "mustard",
  "wholegrain mustard": "mustard",
  "mustard english": "mustard",
  "fresh basil": "basil",
  "fresh coriander": "coriander",
  "fresh parsley": "parsley",
  "ground cumin": "cumin",
  "smoked paprika": "paprika",
  "ground turmeric": "turmeric",
  "ground cinnamon": "cinnamon",
};
