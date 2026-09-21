import { attachRetinolToMicroEntry } from "@/lib/nutrition/vitamin-a-retinol";
import { MICRO_ALIAS_EXPANSION, MICRO_DB_EXPANSION } from "@/lib/nutrition/micros-expansion";

export type MicroEntry = {
  vitamin_a_mcg: number;
  /** Preformed retinol (mcg) — set by lookupMicros for upper-limit checks. */
  retinol_mcg?: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  vitamin_b12_mcg: number;
  folate_mcg: number;
  iron_mg: number;
  calcium_mg: number;
  zinc_mg: number;
  magnesium_mg: number;
  potassium_mg: number;
  selenium_mcg: number;
  iodine_mcg: number;
  saturated_fat_g: number;
  salt_g: number;
  sugar_g: number;
};

export const MICRO_DB: Record<string, MicroEntry> = {
  "chicken breast": {
    vitamin_a_mcg: 9,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0.1,
    vitamin_b12_mcg: 0.3,
    folate_mcg: 4,
    iron_mg: 0.7,
    calcium_mg: 11,
    zinc_mg: 1.5,
    magnesium_mg: 29,
    potassium_mg: 370,
    selenium_mcg: 27,
    iodine_mcg: 3,
    saturated_fat_g: 1,
    salt_g: 0.2,
    sugar_g: 0,
  },
  "salmon fillet": {
    vitamin_a_mcg: 14,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 11,
    vitamin_b12_mcg: 3.2,
    folate_mcg: 25,
    iron_mg: 0.4,
    calcium_mg: 12,
    zinc_mg: 0.5,
    magnesium_mg: 29,
    potassium_mg: 490,
    selenium_mcg: 36,
    iodine_mcg: 14,
    saturated_fat_g: 3.1,
    salt_g: 0.1,
    sugar_g: 0,
  },
  eggs: {
    vitamin_a_mcg: 190,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 1.8,
    vitamin_b12_mcg: 1.3,
    folate_mcg: 50,
    iron_mg: 1.9,
    calcium_mg: 52,
    zinc_mg: 1.3,
    magnesium_mg: 12,
    potassium_mg: 130,
    selenium_mcg: 11,
    iodine_mcg: 50,
    saturated_fat_g: 3.3,
    salt_g: 0.3,
    sugar_g: 1.1,
  },
  spinach: {
    vitamin_a_mcg: 469,
    vitamin_c_mg: 28,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 150,
    iron_mg: 2.1,
    calcium_mg: 99,
    zinc_mg: 0.5,
    magnesium_mg: 79,
    potassium_mg: 554,
    selenium_mcg: 1,
    iodine_mcg: 1,
    saturated_fat_g: 0.1,
    salt_g: 0.2,
    sugar_g: 0.4,
  },
  broccoli: {
    vitamin_a_mcg: 31,
    vitamin_c_mg: 89,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 63,
    iron_mg: 0.7,
    calcium_mg: 47,
    zinc_mg: 0.4,
    magnesium_mg: 21,
    potassium_mg: 316,
    selenium_mcg: 2.5,
    iodine_mcg: 1,
    saturated_fat_g: 0.1,
    salt_g: 0.1,
    sugar_g: 1.7,
  },
  milk: {
    vitamin_a_mcg: 52,
    vitamin_c_mg: 1,
    vitamin_d_mcg: 0.1,
    vitamin_b12_mcg: 0.4,
    folate_mcg: 9,
    iron_mg: 0.1,
    calcium_mg: 120,
    zinc_mg: 0.4,
    magnesium_mg: 11,
    potassium_mg: 150,
    selenium_mcg: 2,
    iodine_mcg: 31,
    saturated_fat_g: 0.6,
    salt_g: 0.1,
    sugar_g: 5,
  },
  "greek yoghurt": {
    vitamin_a_mcg: 36,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0.1,
    vitamin_b12_mcg: 0.5,
    folate_mcg: 7,
    iron_mg: 0.1,
    calcium_mg: 150,
    zinc_mg: 0.6,
    magnesium_mg: 17,
    potassium_mg: 250,
    selenium_mcg: 3,
    iodine_mcg: 37,
    saturated_fat_g: 3.2,
    salt_g: 0.1,
    sugar_g: 3.6,
  },
  lentils: {
    vitamin_a_mcg: 1,
    vitamin_c_mg: 1.5,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 181,
    iron_mg: 3.3,
    calcium_mg: 19,
    zinc_mg: 1.3,
    magnesium_mg: 36,
    potassium_mg: 369,
    selenium_mcg: 2.8,
    iodine_mcg: 0,
    saturated_fat_g: 0.1,
    salt_g: 0,
    sugar_g: 1.8,
  },
  chickpeas: {
    vitamin_a_mcg: 1,
    vitamin_c_mg: 1.3,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 172,
    iron_mg: 2.9,
    calcium_mg: 49,
    zinc_mg: 1.5,
    magnesium_mg: 48,
    potassium_mg: 291,
    selenium_mcg: 3.7,
    iodine_mcg: 0,
    saturated_fat_g: 0.3,
    salt_g: 0.1,
    sugar_g: 4.8,
  },
  banana: {
    vitamin_a_mcg: 3,
    vitamin_c_mg: 8.7,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 20,
    iron_mg: 0.3,
    calcium_mg: 5,
    zinc_mg: 0.2,
    magnesium_mg: 27,
    potassium_mg: 358,
    selenium_mcg: 1,
    iodine_mcg: 0,
    saturated_fat_g: 0.1,
    salt_g: 0,
    sugar_g: 12,
  },
  "sweet potato": {
    vitamin_a_mcg: 961,
    vitamin_c_mg: 2.4,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 11,
    iron_mg: 0.6,
    calcium_mg: 30,
    zinc_mg: 0.3,
    magnesium_mg: 25,
    potassium_mg: 337,
    selenium_mcg: 0.6,
    iodine_mcg: 0,
    saturated_fat_g: 0,
    salt_g: 0.1,
    sugar_g: 4.2,
  },
  salmon: {
    vitamin_a_mcg: 14,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 11,
    vitamin_b12_mcg: 3.2,
    folate_mcg: 25,
    iron_mg: 0.4,
    calcium_mg: 12,
    zinc_mg: 0.5,
    magnesium_mg: 29,
    potassium_mg: 490,
    selenium_mcg: 36,
    iodine_mcg: 14,
    saturated_fat_g: 3.1,
    salt_g: 0.1,
    sugar_g: 0,
  },
  oats: {
    vitamin_a_mcg: 0,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 56,
    iron_mg: 3.6,
    calcium_mg: 54,
    zinc_mg: 2.9,
    magnesium_mg: 144,
    potassium_mg: 429,
    selenium_mcg: 34,
    iodine_mcg: 4,
    saturated_fat_g: 1.2,
    salt_g: 0,
    sugar_g: 1,
  },
  almonds: {
    vitamin_a_mcg: 0,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 50,
    iron_mg: 3.7,
    calcium_mg: 264,
    zinc_mg: 3.1,
    magnesium_mg: 270,
    potassium_mg: 733,
    selenium_mcg: 4.1,
    iodine_mcg: 0,
    saturated_fat_g: 3.8,
    salt_g: 0,
    sugar_g: 4.4,
  },
  "tuna canned": {
    vitamin_a_mcg: 10,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 4.9,
    vitamin_b12_mcg: 2.2,
    folate_mcg: 6,
    iron_mg: 1.3,
    calcium_mg: 12,
    zinc_mg: 0.6,
    magnesium_mg: 31,
    potassium_mg: 290,
    selenium_mcg: 80,
    iodine_mcg: 16,
    saturated_fat_g: 0.2,
    salt_g: 1,
    sugar_g: 0,
  },
  "chicken thigh": {
    vitamin_a_mcg: 18, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.4, folate_mcg: 7, iron_mg: 1.0, calcium_mg: 12, zinc_mg: 2.0, magnesium_mg: 24, potassium_mg: 310, selenium_mcg: 22, iodine_mcg: 3, saturated_fat_g: 3, salt_g: 0.2, sugar_g: 0,
  },
  // Rice micros are per 100 g DRY (scaled ×2.7 / ×2.85 from the cooked values they were).
  "brown rice": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 24.3, iron_mg: 2.2, calcium_mg: 27, zinc_mg: 3, magnesium_mg: 118.8, potassium_mg: 213.3, selenium_mcg: 37.8, iodine_mcg: 2.7, saturated_fat_g: 0.5, salt_g: 0, sugar_g: 0,
  },
  "white rice": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 11.4, iron_mg: 0.6, calcium_mg: 25.7, zinc_mg: 1.4, magnesium_mg: 34.2, potassium_mg: 82.7, selenium_mcg: 25.7, iodine_mcg: 2.9, saturated_fat_g: 0.3, salt_g: 0, sugar_g: 0,
  },
  pasta: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 18, iron_mg: 1.3, calcium_mg: 7, zinc_mg: 0.8, magnesium_mg: 18, potassium_mg: 58, selenium_mcg: 26, iodine_mcg: 2, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 0.6,
  },
  carrots: {
    vitamin_a_mcg: 852, vitamin_c_mg: 5.9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 14, iron_mg: 0.3, calcium_mg: 33, zinc_mg: 0.2, magnesium_mg: 12, potassium_mg: 320, selenium_mcg: 0.1, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 4.7,
  },
  peppers: {
    vitamin_a_mcg: 157, vitamin_c_mg: 128, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 46, iron_mg: 0.4, calcium_mg: 10, zinc_mg: 0.2, magnesium_mg: 12, potassium_mg: 211, selenium_mcg: 0.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.2,
  },
  "red pepper": {
    vitamin_a_mcg: 157, vitamin_c_mg: 128, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 46, iron_mg: 0.4, calcium_mg: 10, zinc_mg: 0.2, magnesium_mg: 12, potassium_mg: 211, selenium_mcg: 0.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.2,
  },
  tomatoes: {
    vitamin_a_mcg: 42, vitamin_c_mg: 14, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 15, iron_mg: 0.3, calcium_mg: 10, zinc_mg: 0.2, magnesium_mg: 11, potassium_mg: 237, selenium_mcg: 0.4, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 2.6,
  },
  mushrooms: {
    vitamin_a_mcg: 0, vitamin_c_mg: 2.1, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.1, folate_mcg: 16, iron_mg: 0.4, calcium_mg: 6, zinc_mg: 0.5, magnesium_mg: 9, potassium_mg: 318, selenium_mcg: 8.9, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 1.7,
  },
  onion: {
    vitamin_a_mcg: 0, vitamin_c_mg: 7.4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 19, iron_mg: 0.2, calcium_mg: 20, zinc_mg: 0.2, magnesium_mg: 10, potassium_mg: 146, selenium_mcg: 0.5, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.2,
  },
  garlic: {
    vitamin_a_mcg: 0, vitamin_c_mg: 31, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 3, iron_mg: 1.7, calcium_mg: 181, zinc_mg: 1.2, magnesium_mg: 25, potassium_mg: 401, selenium_mcg: 14, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 1,
  },
  avocado: {
    vitamin_a_mcg: 7, vitamin_c_mg: 10, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 81, iron_mg: 0.6, calcium_mg: 12, zinc_mg: 0.6, magnesium_mg: 29, potassium_mg: 485, selenium_mcg: 0.4, iodine_mcg: 0, saturated_fat_g: 2.1, salt_g: 0, sugar_g: 0.7,
  },
  blueberries: {
    vitamin_a_mcg: 3, vitamin_c_mg: 9.7, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 6, iron_mg: 0.3, calcium_mg: 6, zinc_mg: 0.2, magnesium_mg: 6, potassium_mg: 77, selenium_mcg: 0.1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 10,
  },
  strawberries: {
    vitamin_a_mcg: 1, vitamin_c_mg: 59, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 24, iron_mg: 0.4, calcium_mg: 16, zinc_mg: 0.1, magnesium_mg: 13, potassium_mg: 153, selenium_mcg: 0.4, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.9,
  },
  apple: {
    vitamin_a_mcg: 3, vitamin_c_mg: 4.6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 3, iron_mg: 0.1, calcium_mg: 6, zinc_mg: 0, magnesium_mg: 5, potassium_mg: 107, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 10,
  },
  orange: {
    vitamin_a_mcg: 11, vitamin_c_mg: 53, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 30, iron_mg: 0.1, calcium_mg: 40, zinc_mg: 0.1, magnesium_mg: 10, potassium_mg: 181, selenium_mcg: 0.5, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 9,
  },
  courgette: {
    vitamin_a_mcg: 10, vitamin_c_mg: 17, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 24, iron_mg: 0.4, calcium_mg: 16, zinc_mg: 0.3, magnesium_mg: 18, potassium_mg: 262, selenium_mcg: 0.2, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 2.5,
  },
  cucumber: {
    vitamin_a_mcg: 5, vitamin_c_mg: 2.8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 7, iron_mg: 0.3, calcium_mg: 16, zinc_mg: 0.2, magnesium_mg: 13, potassium_mg: 147, selenium_mcg: 0.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 1.7,
  },
  peas: {
    vitamin_a_mcg: 38, vitamin_c_mg: 40, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 65, iron_mg: 1.5, calcium_mg: 25, zinc_mg: 1.2, magnesium_mg: 33, potassium_mg: 244, selenium_mcg: 1.8, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 5.7,
  },
  cauliflower: {
    vitamin_a_mcg: 0, vitamin_c_mg: 48, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 57, iron_mg: 0.4, calcium_mg: 22, zinc_mg: 0.3, magnesium_mg: 15, potassium_mg: 299, selenium_mcg: 0.6, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 1.9,
  },
  kale: {
    vitamin_a_mcg: 241, vitamin_c_mg: 93, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 13, iron_mg: 1.5, calcium_mg: 135, zinc_mg: 0.4, magnesium_mg: 34, potassium_mg: 447, selenium_mcg: 0.9, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0.1, sugar_g: 2.3,
  },
  tofu: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0.1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 15, iron_mg: 1.6, calcium_mg: 350, zinc_mg: 0.8, magnesium_mg: 30, potassium_mg: 121, selenium_mcg: 8.9, iodine_mcg: 0, saturated_fat_g: 0.7, salt_g: 0, sugar_g: 0.7,
  },
  "peanut butter": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 87, iron_mg: 1.7, calcium_mg: 43, zinc_mg: 2.5, magnesium_mg: 168, potassium_mg: 649, selenium_mcg: 3.7, iodine_mcg: 0, saturated_fat_g: 10, salt_g: 0.5, sugar_g: 9,
  },
  "chia seeds": {
    vitamin_a_mcg: 0, vitamin_c_mg: 1.6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 49, iron_mg: 7.7, calcium_mg: 631, zinc_mg: 4.6, magnesium_mg: 335, potassium_mg: 407, selenium_mcg: 55, iodine_mcg: 0, saturated_fat_g: 3.3, salt_g: 0, sugar_g: 0,
  },
  walnuts: {
    vitamin_a_mcg: 1, vitamin_c_mg: 1.3, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 98, iron_mg: 2.9, calcium_mg: 98, zinc_mg: 3.1, magnesium_mg: 158, potassium_mg: 441, selenium_mcg: 4.9, iodine_mcg: 0, saturated_fat_g: 6.1, salt_g: 0, sugar_g: 2.6,
  },
  "kidney beans": {
    vitamin_a_mcg: 0, vitamin_c_mg: 1.2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 130, iron_mg: 2.9, calcium_mg: 28, zinc_mg: 1.1, magnesium_mg: 45, potassium_mg: 355, selenium_mcg: 1.2, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0.3,
  },
  "black beans": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 149, iron_mg: 2.1, calcium_mg: 27, zinc_mg: 1.1, magnesium_mg: 70, potassium_mg: 355, selenium_mcg: 1.2, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0.3,
  },
  "wholemeal bread": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 39, iron_mg: 2.7, calcium_mg: 54, zinc_mg: 1.8, magnesium_mg: 76, potassium_mg: 230, selenium_mcg: 28, iodine_mcg: 5, saturated_fat_g: 0.6, salt_g: 1.1, sugar_g: 3.4,
  },
  bread: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 29, iron_mg: 1.6, calcium_mg: 177, zinc_mg: 0.6, magnesium_mg: 24, potassium_mg: 100, selenium_mcg: 11, iodine_mcg: 4, saturated_fat_g: 0.7, salt_g: 1.2, sugar_g: 3.8,
  },
  "coconut milk": {
    vitamin_a_mcg: 0, vitamin_c_mg: 1.5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 16, iron_mg: 1.6, calcium_mg: 16, zinc_mg: 0.7, magnesium_mg: 37, potassium_mg: 263, selenium_mcg: 6.2, iodine_mcg: 0, saturated_fat_g: 20, salt_g: 0, sugar_g: 3.3,
  },
  "olive oil": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 0, iron_mg: 0.4, calcium_mg: 1, zinc_mg: 0, magnesium_mg: 0, potassium_mg: 1, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 14, salt_g: 0, sugar_g: 0,
  },
  butter: {
    vitamin_a_mcg: 684, vitamin_c_mg: 0, vitamin_d_mcg: 0.9, vitamin_b12_mcg: 0.2, folate_mcg: 3, iron_mg: 0.2, calcium_mg: 15, zinc_mg: 0.1, magnesium_mg: 2, potassium_mg: 24, selenium_mcg: 1, iodine_mcg: 3, saturated_fat_g: 51, salt_g: 1.8, sugar_g: 0.1,
  },
  "cheddar cheese": {
    vitamin_a_mcg: 325, vitamin_c_mg: 0, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 1.1, folate_mcg: 27, iron_mg: 0.3, calcium_mg: 720, zinc_mg: 2.3, magnesium_mg: 25, potassium_mg: 98, selenium_mcg: 12, iodine_mcg: 37, saturated_fat_g: 21, salt_g: 1.6, sugar_g: 0.1,
  },
  mozzarella: {
    vitamin_a_mcg: 179, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.7, folate_mcg: 7, iron_mg: 0.2, calcium_mg: 505, zinc_mg: 2.9, magnesium_mg: 20, potassium_mg: 76, selenium_mcg: 14, iodine_mcg: 29, saturated_fat_g: 11, salt_g: 1.6, sugar_g: 1,
  },
  "cottage cheese": {
    vitamin_a_mcg: 37, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.4, folate_mcg: 12, iron_mg: 0.1, calcium_mg: 83, zinc_mg: 0.4, magnesium_mg: 8, potassium_mg: 104, selenium_mcg: 9, iodine_mcg: 26, saturated_fat_g: 1.7, salt_g: 0.4, sugar_g: 2.7,
  },
  "feta cheese": {
    vitamin_a_mcg: 125, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 1.7, folate_mcg: 32, iron_mg: 0.7, calcium_mg: 492, zinc_mg: 2.9, magnesium_mg: 19, potassium_mg: 62, selenium_mcg: 8, iodine_mcg: 28, saturated_fat_g: 13, salt_g: 2.5, sugar_g: 0.5,
  },
  "turkey breast": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.4, folate_mcg: 7, iron_mg: 0.7, calcium_mg: 11, zinc_mg: 1.5, magnesium_mg: 28, potassium_mg: 293, selenium_mcg: 24, iodine_mcg: 3, saturated_fat_g: 0.3, salt_g: 0.2, sugar_g: 0,
  },
  "beef mince": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 2.5, folate_mcg: 8, iron_mg: 2.5, calcium_mg: 18, zinc_mg: 4.5, magnesium_mg: 20, potassium_mg: 318, selenium_mcg: 15, iodine_mcg: 2, saturated_fat_g: 5.5, salt_g: 0.2, sugar_g: 0,
  },
  mackerel: {
    vitamin_a_mcg: 50, vitamin_c_mg: 0, vitamin_d_mcg: 16, vitamin_b12_mcg: 7, folate_mcg: 10, iron_mg: 1.6, calcium_mg: 12, zinc_mg: 0.6, magnesium_mg: 76, potassium_mg: 314, selenium_mcg: 44, iodine_mcg: 130, saturated_fat_g: 3.3, salt_g: 0.1, sugar_g: 0,
  },
  "green beans": {
    vitamin_a_mcg: 35, vitamin_c_mg: 12, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 33, iron_mg: 1, calcium_mg: 37, zinc_mg: 0.2, magnesium_mg: 25, potassium_mg: 211, selenium_mcg: 0.6, iodine_mcg: 1, saturated_fat_g: 0, salt_g: 0, sugar_g: 3.3,
  },
  quinoa: {
    vitamin_a_mcg: 1, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 42, iron_mg: 1.5, calcium_mg: 17, zinc_mg: 1.1, magnesium_mg: 64, potassium_mg: 172, selenium_mcg: 2.8, iodine_mcg: 0, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 0.9,
  },
  "soy sauce": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 18, iron_mg: 1.9, calcium_mg: 20, zinc_mg: 0.3, magnesium_mg: 40, potassium_mg: 435, selenium_mcg: 0.9, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 14.6, sugar_g: 1.7,
  },
  honey: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0.5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 2, iron_mg: 0.4, calcium_mg: 6, zinc_mg: 0.2, magnesium_mg: 2, potassium_mg: 52, selenium_mcg: 0.8, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 82,
  },
  "protein powder": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 2.5, vitamin_b12_mcg: 1.2, folate_mcg: 20, iron_mg: 2.0, calcium_mg: 130, zinc_mg: 2.5, magnesium_mg: 50, potassium_mg: 200, selenium_mcg: 10, iodine_mcg: 5, saturated_fat_g: 1.5, salt_g: 0.3, sugar_g: 5,
  },
  "whey protein": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 2.5, vitamin_b12_mcg: 1.4, folate_mcg: 15, iron_mg: 0.5, calcium_mg: 160, zinc_mg: 1.5, magnesium_mg: 30, potassium_mg: 160, selenium_mcg: 8, iodine_mcg: 10, saturated_fat_g: 1, salt_g: 0.3, sugar_g: 5,
  },

  // --- Template-catalog foods (generated recipes use these exact names) ---
  cod: {
    vitamin_a_mcg: 14, vitamin_c_mg: 1, vitamin_d_mcg: 1, vitamin_b12_mcg: 1, folate_mcg: 7, iron_mg: 0.4, calcium_mg: 16, zinc_mg: 0.5, magnesium_mg: 26, potassium_mg: 360, selenium_mcg: 33, iodine_mcg: 110, saturated_fat_g: 0.1, salt_g: 0.2, sugar_g: 0,
  },
  shrimp: {
    vitamin_a_mcg: 54, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 1.5, folate_mcg: 18, iron_mg: 0.5, calcium_mg: 70, zinc_mg: 1.3, magnesium_mg: 37, potassium_mg: 180, selenium_mcg: 38, iodine_mcg: 30, saturated_fat_g: 0.1, salt_g: 0.6, sugar_g: 0,
  },
  rice: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 4, iron_mg: 0.2, calcium_mg: 9, zinc_mg: 0.5, magnesium_mg: 12, potassium_mg: 29, selenium_mcg: 9, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0,
  },
  potato: {
    vitamin_a_mcg: 0, vitamin_c_mg: 13, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 16, iron_mg: 0.4, calcium_mg: 5, zinc_mg: 0.3, magnesium_mg: 22, potassium_mg: 421, selenium_mcg: 0.3, iodine_mcg: 3, saturated_fat_g: 0, salt_g: 0, sugar_g: 0.9,
  },
  "buckwheat groats": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 14, iron_mg: 0.8, calcium_mg: 7, zinc_mg: 0.6, magnesium_mg: 51, potassium_mg: 88, selenium_mcg: 2.2, iodine_mcg: 0, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 0,
  },
  "rice cake": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 4, iron_mg: 0.5, calcium_mg: 11, zinc_mg: 1.0, magnesium_mg: 33, potassium_mg: 26, selenium_mcg: 9, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0.3, sugar_g: 0,
  },
  cornflakes: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 2.1, vitamin_b12_mcg: 1.7, folate_mcg: 200, iron_mg: 8, calcium_mg: 15, zinc_mg: 0.4, magnesium_mg: 6, potassium_mg: 110, selenium_mcg: 3, iodine_mcg: 5, saturated_fat_g: 0.1, salt_g: 1.1, sugar_g: 8,
  },
  raspberries: {
    vitamin_a_mcg: 2, vitamin_c_mg: 26, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 21, iron_mg: 0.7, calcium_mg: 25, zinc_mg: 0.4, magnesium_mg: 22, potassium_mg: 151, selenium_mcg: 0.2, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 4.4,
  },
  "oat milk": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 1.5, vitamin_b12_mcg: 1.2, folate_mcg: 5, iron_mg: 0.2, calcium_mg: 120, zinc_mg: 0.1, magnesium_mg: 8, potassium_mg: 130, selenium_mcg: 1, iodine_mcg: 22, saturated_fat_g: 0.2, salt_g: 0.1, sugar_g: 2.5,
  },
  "almond milk": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 1.5, vitamin_b12_mcg: 0.4, folate_mcg: 2, iron_mg: 0.3, calcium_mg: 120, zinc_mg: 0.1, magnesium_mg: 6, potassium_mg: 60, selenium_mcg: 0.1, iodine_mcg: 22, saturated_fat_g: 0.1, salt_g: 0.1, sugar_g: 2,
  },
  cashews: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0.5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 25, iron_mg: 6.7, calcium_mg: 37, zinc_mg: 5.8, magnesium_mg: 292, potassium_mg: 660, selenium_mcg: 20, iodine_mcg: 0, saturated_fat_g: 8, salt_g: 0, sugar_g: 6,
  },
  "pumpkin seeds": {
    vitamin_a_mcg: 1, vitamin_c_mg: 1.9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 58, iron_mg: 8.8, calcium_mg: 46, zinc_mg: 7.8, magnesium_mg: 592, potassium_mg: 809, selenium_mcg: 9.4, iodine_mcg: 0, saturated_fat_g: 1.7, salt_g: 0, sugar_g: 1.4,
  },

  // --- Common whole foods (frequent in imported & user recipes) ---
  pear: {
    vitamin_a_mcg: 1, vitamin_c_mg: 4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 7, iron_mg: 0.2, calcium_mg: 9, zinc_mg: 0.1, magnesium_mg: 7, potassium_mg: 116, selenium_mcg: 0.1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 10,
  },
  peach: {
    vitamin_a_mcg: 16, vitamin_c_mg: 7, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 4, iron_mg: 0.3, calcium_mg: 6, zinc_mg: 0.2, magnesium_mg: 9, potassium_mg: 190, selenium_mcg: 0.1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 8,
  },
  plum: {
    vitamin_a_mcg: 17, vitamin_c_mg: 9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 5, iron_mg: 0.2, calcium_mg: 6, zinc_mg: 0.1, magnesium_mg: 7, potassium_mg: 157, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 10,
  },
  kiwi: {
    vitamin_a_mcg: 4, vitamin_c_mg: 93, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 25, iron_mg: 0.3, calcium_mg: 34, zinc_mg: 0.1, magnesium_mg: 17, potassium_mg: 312, selenium_mcg: 0.2, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 9,
  },
  mango: {
    vitamin_a_mcg: 54, vitamin_c_mg: 36, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 43, iron_mg: 0.2, calcium_mg: 11, zinc_mg: 0.1, magnesium_mg: 10, potassium_mg: 168, selenium_mcg: 0.6, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 14,
  },
  grapes: {
    vitamin_a_mcg: 3, vitamin_c_mg: 3, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 2, iron_mg: 0.4, calcium_mg: 10, zinc_mg: 0.1, magnesium_mg: 7, potassium_mg: 191, selenium_mcg: 0.1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 16,
  },
  pineapple: {
    vitamin_a_mcg: 3, vitamin_c_mg: 48, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 18, iron_mg: 0.3, calcium_mg: 13, zinc_mg: 0.1, magnesium_mg: 12, potassium_mg: 109, selenium_mcg: 0.1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 10,
  },
  watermelon: {
    vitamin_a_mcg: 28, vitamin_c_mg: 8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 3, iron_mg: 0.2, calcium_mg: 7, zinc_mg: 0.1, magnesium_mg: 10, potassium_mg: 112, selenium_mcg: 0.4, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 6,
  },
  lemon: {
    vitamin_a_mcg: 1, vitamin_c_mg: 53, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 11, iron_mg: 0.6, calcium_mg: 26, zinc_mg: 0.1, magnesium_mg: 8, potassium_mg: 138, selenium_mcg: 0.4, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 2.5,
  },
  lime: {
    vitamin_a_mcg: 2, vitamin_c_mg: 29, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 8, iron_mg: 0.6, calcium_mg: 33, zinc_mg: 0.1, magnesium_mg: 6, potassium_mg: 102, selenium_mcg: 0.4, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 1.7,
  },
  celery: {
    vitamin_a_mcg: 22, vitamin_c_mg: 3, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 36, iron_mg: 0.2, calcium_mg: 40, zinc_mg: 0.1, magnesium_mg: 11, potassium_mg: 260, selenium_mcg: 0.4, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 1.3,
  },
  cabbage: {
    vitamin_a_mcg: 5, vitamin_c_mg: 37, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 43, iron_mg: 0.5, calcium_mg: 40, zinc_mg: 0.2, magnesium_mg: 12, potassium_mg: 170, selenium_mcg: 0.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 3.2,
  },
  asparagus: {
    vitamin_a_mcg: 38, vitamin_c_mg: 5.6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 52, iron_mg: 2.1, calcium_mg: 24, zinc_mg: 0.5, magnesium_mg: 14, potassium_mg: 202, selenium_mcg: 2.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 1.9,
  },
  aubergine: {
    vitamin_a_mcg: 1, vitamin_c_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 22, iron_mg: 0.2, calcium_mg: 9, zinc_mg: 0.2, magnesium_mg: 14, potassium_mg: 229, selenium_mcg: 0.3, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 3.5,
  },
  leek: {
    vitamin_a_mcg: 83, vitamin_c_mg: 12, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 64, iron_mg: 2.1, calcium_mg: 59, zinc_mg: 0.1, magnesium_mg: 28, potassium_mg: 180, selenium_mcg: 1, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 3.9,
  },
  corn: {
    vitamin_a_mcg: 9, vitamin_c_mg: 6.8, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 42, iron_mg: 0.5, calcium_mg: 2, zinc_mg: 0.5, magnesium_mg: 37, potassium_mg: 270, selenium_mcg: 0.6, iodine_mcg: 0, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 4.5,
  },
  "butternut squash": {
    vitamin_a_mcg: 532, vitamin_c_mg: 21, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 27, iron_mg: 0.7, calcium_mg: 48, zinc_mg: 0.2, magnesium_mg: 34, potassium_mg: 352, selenium_mcg: 0.5, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 2.2,
  },
  beetroot: {
    vitamin_a_mcg: 2, vitamin_c_mg: 5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 109, iron_mg: 0.8, calcium_mg: 16, zinc_mg: 0.4, magnesium_mg: 23, potassium_mg: 325, selenium_mcg: 0.7, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0.1, sugar_g: 7,
  },
  couscous: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 15, iron_mg: 0.4, calcium_mg: 8, zinc_mg: 0.4, magnesium_mg: 12, potassium_mg: 58, selenium_mcg: 28, iodine_mcg: 0, saturated_fat_g: 0, salt_g: 0, sugar_g: 0.1,
  },
  "bulgur wheat": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 18, iron_mg: 1.0, calcium_mg: 10, zinc_mg: 0.6, magnesium_mg: 32, potassium_mg: 68, selenium_mcg: 0.6, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0.1,
  },
  "soy milk": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 1.5, vitamin_b12_mcg: 1.1, folate_mcg: 9, iron_mg: 0.4, calcium_mg: 120, zinc_mg: 0.3, magnesium_mg: 15, potassium_mg: 120, selenium_mcg: 1.5, iodine_mcg: 16, saturated_fat_g: 0.3, salt_g: 0.1, sugar_g: 2.5,
  },
  "cream cheese": {
    vitamin_a_mcg: 308, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.3, folate_mcg: 11, iron_mg: 0.1, calcium_mg: 98, zinc_mg: 0.5, magnesium_mg: 9, potassium_mg: 138, selenium_mcg: 3, iodine_mcg: 20, saturated_fat_g: 21, salt_g: 0.7, sugar_g: 3.2,
  },
  parmesan: {
    vitamin_a_mcg: 207, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 1.2, folate_mcg: 7, iron_mg: 0.8, calcium_mg: 1180, zinc_mg: 2.8, magnesium_mg: 44, potassium_mg: 92, selenium_mcg: 23, iodine_mcg: 36, saturated_fat_g: 19, salt_g: 1.6, sugar_g: 0,
  },
  ricotta: {
    vitamin_a_mcg: 120, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.3, folate_mcg: 12, iron_mg: 0.4, calcium_mg: 207, zinc_mg: 1.2, magnesium_mg: 11, potassium_mg: 105, selenium_mcg: 15, iodine_mcg: 20, saturated_fat_g: 7.5, salt_g: 0.3, sugar_g: 3,
  },
  halloumi: {
    vitamin_a_mcg: 180, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.8, folate_mcg: 8, iron_mg: 0.4, calcium_mg: 700, zinc_mg: 2.8, magnesium_mg: 24, potassium_mg: 80, selenium_mcg: 14, iodine_mcg: 30, saturated_fat_g: 16, salt_g: 2.7, sugar_g: 1,
  },
  "egg white": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.1, folate_mcg: 4, iron_mg: 0.1, calcium_mg: 7, zinc_mg: 0, magnesium_mg: 11, potassium_mg: 163, selenium_mcg: 20, iodine_mcg: 2, saturated_fat_g: 0, salt_g: 0.4, sugar_g: 0.7,
  },
  tempeh: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.1, folate_mcg: 24, iron_mg: 2.7, calcium_mg: 111, zinc_mg: 1.1, magnesium_mg: 81, potassium_mg: 412, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 2, salt_g: 0, sugar_g: 0,
  },
  edamame: {
    vitamin_a_mcg: 15, vitamin_c_mg: 6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 311, iron_mg: 2.3, calcium_mg: 63, zinc_mg: 1.3, magnesium_mg: 64, potassium_mg: 436, selenium_mcg: 0.8, iodine_mcg: 0, saturated_fat_g: 0.6, salt_g: 0, sugar_g: 2.4,
  },
  "cannellini beans": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 144, iron_mg: 2.5, calcium_mg: 60, zinc_mg: 1, magnesium_mg: 50, potassium_mg: 391, selenium_mcg: 1, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0.3,
  },
  "baked beans": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 29, iron_mg: 1.4, calcium_mg: 53, zinc_mg: 0.6, magnesium_mg: 31, potassium_mg: 296, selenium_mcg: 1.2, iodine_mcg: 0, saturated_fat_g: 0.1, salt_g: 0.6, sugar_g: 5,
  },
  hummus: {
    vitamin_a_mcg: 0, vitamin_c_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 83, iron_mg: 2.4, calcium_mg: 38, zinc_mg: 1.4, magnesium_mg: 71, potassium_mg: 228, selenium_mcg: 2.5, iodine_mcg: 0, saturated_fat_g: 1.4, salt_g: 1, sugar_g: 0.3,
  },
  peanuts: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 145, iron_mg: 2.3, calcium_mg: 62, zinc_mg: 2.8, magnesium_mg: 184, potassium_mg: 634, selenium_mcg: 7.5, iodine_mcg: 0, saturated_fat_g: 6.3, salt_g: 0, sugar_g: 4,
  },
  "sunflower seeds": {
    vitamin_a_mcg: 1, vitamin_c_mg: 1.4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 227, iron_mg: 5.2, calcium_mg: 78, zinc_mg: 5, magnesium_mg: 325, potassium_mg: 645, selenium_mcg: 53, iodine_mcg: 0, saturated_fat_g: 3.7, salt_g: 0, sugar_g: 2.6,
  },
  flaxseeds: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0.6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 87, iron_mg: 5.7, calcium_mg: 255, zinc_mg: 4.3, magnesium_mg: 392, potassium_mg: 813, selenium_mcg: 25, iodine_mcg: 0, saturated_fat_g: 3.7, salt_g: 0, sugar_g: 1.6,
  },
  "sesame seeds": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 97, iron_mg: 14.6, calcium_mg: 975, zinc_mg: 7.8, magnesium_mg: 351, potassium_mg: 468, selenium_mcg: 34, iodine_mcg: 0, saturated_fat_g: 6.7, salt_g: 0, sugar_g: 0.3,
  },
  tahini: {
    vitamin_a_mcg: 1, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 98, iron_mg: 8.9, calcium_mg: 426, zinc_mg: 4.6, magnesium_mg: 95, potassium_mg: 414, selenium_mcg: 34, iodine_mcg: 0, saturated_fat_g: 7.3, salt_g: 0.1, sugar_g: 0.5,
  },
  "almond butter": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 53, iron_mg: 3.7, calcium_mg: 347, zinc_mg: 3.3, magnesium_mg: 279, potassium_mg: 748, selenium_mcg: 4, iodine_mcg: 0, saturated_fat_g: 3.7, salt_g: 0, sugar_g: 4.4,
  },
  haddock: {
    vitamin_a_mcg: 9, vitamin_c_mg: 0, vitamin_d_mcg: 1, vitamin_b12_mcg: 1.2, folate_mcg: 11, iron_mg: 0.7, calcium_mg: 23, zinc_mg: 0.4, magnesium_mg: 30, potassium_mg: 351, selenium_mcg: 30, iodine_mcg: 190, saturated_fat_g: 0.1, salt_g: 0.2, sugar_g: 0,
  },
  sardines: {
    vitamin_a_mcg: 32, vitamin_c_mg: 0, vitamin_d_mcg: 4.8, vitamin_b12_mcg: 8.9, folate_mcg: 10, iron_mg: 2.9, calcium_mg: 382, zinc_mg: 1.3, magnesium_mg: 39, potassium_mg: 397, selenium_mcg: 53, iodine_mcg: 35, saturated_fat_g: 1.5, salt_g: 0.9, sugar_g: 0,
  },
  "chicken mince": {
    vitamin_a_mcg: 18, vitamin_c_mg: 0, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.5, folate_mcg: 7, iron_mg: 0.9, calcium_mg: 12, zinc_mg: 1.8, magnesium_mg: 24, potassium_mg: 280, selenium_mcg: 18, iodine_mcg: 3, saturated_fat_g: 3, salt_g: 0.2, sugar_g: 0,
  },
  "turkey mince": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 1.0, folate_mcg: 8, iron_mg: 1.2, calcium_mg: 16, zinc_mg: 2.4, magnesium_mg: 24, potassium_mg: 280, selenium_mcg: 22, iodine_mcg: 3, saturated_fat_g: 2.5, salt_g: 0.2, sugar_g: 0,
  },
  "lamb mince": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 2.3, folate_mcg: 18, iron_mg: 1.6, calcium_mg: 14, zinc_mg: 3.4, magnesium_mg: 21, potassium_mg: 280, selenium_mcg: 5, iodine_mcg: 2, saturated_fat_g: 9, salt_g: 0.2, sugar_g: 0,
  },
  "pork mince": {
    vitamin_a_mcg: 2, vitamin_c_mg: 0.7, vitamin_d_mcg: 0.7, vitamin_b12_mcg: 0.7, folate_mcg: 5, iron_mg: 0.9, calcium_mg: 14, zinc_mg: 2.4, magnesium_mg: 24, potassium_mg: 360, selenium_mcg: 30, iodine_mcg: 3, saturated_fat_g: 4, salt_g: 0.2, sugar_g: 0,
  },
  bacon: {
    vitamin_a_mcg: 11, vitamin_c_mg: 0, vitamin_d_mcg: 0.5, vitamin_b12_mcg: 0.7, folate_mcg: 1, iron_mg: 0.5, calcium_mg: 5, zinc_mg: 1.8, magnesium_mg: 16, potassium_mg: 360, selenium_mcg: 22, iodine_mcg: 4, saturated_fat_g: 4, salt_g: 2.5, sugar_g: 0,
  },
  ham: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.6, vitamin_b12_mcg: 0.6, folate_mcg: 1, iron_mg: 0.8, calcium_mg: 6, zinc_mg: 1.5, magnesium_mg: 15, potassium_mg: 290, selenium_mcg: 18, iodine_mcg: 8, saturated_fat_g: 1.3, salt_g: 2.4, sugar_g: 0.5,
  },
  sausages: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0.4, vitamin_b12_mcg: 1, folate_mcg: 3, iron_mg: 1, calcium_mg: 30, zinc_mg: 1.8, magnesium_mg: 14, potassium_mg: 220, selenium_mcg: 14, iodine_mcg: 5, saturated_fat_g: 8, salt_g: 1.7, sugar_g: 1,
  },
  "vegetable oil": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 0, iron_mg: 0, calcium_mg: 0, zinc_mg: 0, magnesium_mg: 0, potassium_mg: 0, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 7, salt_g: 0, sugar_g: 0,
  },
  "coconut oil": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 0, iron_mg: 0, calcium_mg: 0, zinc_mg: 0, magnesium_mg: 0, potassium_mg: 0, selenium_mcg: 0, iodine_mcg: 0, saturated_fat_g: 87, salt_g: 0, sugar_g: 0,
  },
  granola: {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 30, iron_mg: 3, calcium_mg: 50, zinc_mg: 2, magnesium_mg: 90, potassium_mg: 340, selenium_mcg: 12, iodine_mcg: 2, saturated_fat_g: 3, salt_g: 0.1, sugar_g: 15,
  },
};

/** Maps common name variants (plurals, regional spellings, cuts) onto a canonical MICRO_DB key. */
const MICRO_ALIASES: Record<string, string> = {
  egg: "eggs",
  "greek yogurt": "greek yoghurt",
  "natural yogurt": "greek yoghurt",
  "natural yoghurt": "greek yoghurt",
  "low fat yoghurt": "greek yoghurt",
  "low fat yogurt": "greek yoghurt",
  skyr: "greek yoghurt",
  "bell pepper": "red pepper",
  peppers: "red pepper",
  "red peppers": "red pepper",
  "green pepper": "red pepper",
  "yellow pepper": "red pepper",
  carrot: "carrots",
  tomato: "tomatoes",
  "cherry tomatoes": "tomatoes",
  "cherry tomato": "tomatoes",
  tuna: "tuna canned",
  "tuna steak": "tuna canned",
  "salmon fillet": "salmon",
  "smoked salmon": "salmon",
  beef: "beef mince",
  "lean beef mince": "beef mince",
  mince: "beef mince",
  turkey: "turkey breast",
  rocket: "spinach",
  lettuce: "spinach",
  // grains
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "long grain rice": "rice",
  "white rice": "rice",
  spaghetti: "pasta",
  penne: "pasta",
  fusilli: "pasta",
  macaroni: "pasta",
  "wholemeal pasta": "pasta",
  noodles: "pasta",
  "porridge oats": "oats",
  "rolled oats": "oats",
  // dairy & milks
  "whole milk": "milk",
  "skimmed milk": "milk",
  "semi skimmed milk": "milk",
  "semi-skimmed milk": "milk",
  // veg
  zucchini: "courgette",
  "red onion": "onion",
  "spring onion": "onion",
  "frozen peas": "peas",
  "garden peas": "peas",
  sweetcorn: "corn",
  mushroom: "mushrooms",
  // legumes
  "red lentils": "lentils",
  lentil: "lentils",
  chickpea: "chickpeas",
  // seafood
  prawns: "shrimp",
  prawn: "shrimp",
  "king prawns": "shrimp",
  // fruit
  strawberry: "strawberries",
  blueberry: "blueberries",
  raspberry: "raspberries",
  // potatoes
  potatoes: "potato",
  "new potatoes": "potato",
  "jacket potato": "potato",
};

// Merge the expansion before FUZZY_KEYS derives from these maps.
Object.assign(MICRO_DB, MICRO_DB_EXPANSION);
Object.assign(MICRO_ALIASES, MICRO_ALIAS_EXPANSION);

/**
 * Candidate keys for fuzzy matching, longest first so the most specific phrase wins
 * (e.g. "sweet potato" before "potato"). Includes both real DB keys and aliases.
 */
const FUZZY_KEYS: { phrase: string; target: string }[] = [
  ...Object.keys(MICRO_DB).map((k) => ({ phrase: k, target: k })),
  ...Object.entries(MICRO_ALIASES).map(([phrase, target]) => ({ phrase, target })),
]
  .filter((c) => c.phrase.length >= 4)
  .sort((a, b) => b.phrase.length - a.phrase.length);

function resolveMicroEntry(target: string): MicroEntry | null {
  return MICRO_DB[target] ?? (MICRO_ALIASES[target] ? (MICRO_DB[MICRO_ALIASES[target]] ?? null) : null);
}

export function lookupMicros(name: string): MicroEntry | null {
  const key = name.toLowerCase().trim();
  let entry: MicroEntry | null = null;
  if (MICRO_DB[key]) entry = MICRO_DB[key];
  else {
    const aliased = MICRO_ALIASES[key];
    if (aliased && MICRO_DB[aliased]) entry = MICRO_DB[aliased];
  }

  if (!entry) {
    // Fuzzy fallback: match a known food as a whole-word phrase inside the ingredient
    // name (e.g. "grilled chicken breast" -> "chicken breast", "tin of chickpeas" -> "chickpeas").
    // Multi-word phrases are specific enough to match anywhere; single generic words
    // (e.g. "milk", "rice") only match as the head noun (last word) to avoid mis-tagging
    // compounds like "milk chocolate" or "rice pudding".
    const lastWord = key.split(/\s+/).pop() ?? key;
    for (const { phrase, target } of FUZZY_KEYS) {
      const isMultiWord = phrase.includes(" ");
      if (!isMultiWord && phrase !== lastWord) continue;
      const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(key)) {
        const resolved = resolveMicroEntry(target);
        if (resolved) {
          entry = resolved;
          break;
        }
      }
    }
  }

  if (!entry) return null;
  return attachRetinolToMicroEntry(name, entry);
}

export function scaleMicros(micros: MicroEntry, quantityG: number): MicroEntry {
  const scale = quantityG / 100;
  return Object.fromEntries(Object.entries(micros).map(([k, v]) => [k, v * scale])) as MicroEntry;
}

export function sumMicros(entries: MicroEntry[]): MicroEntry {
  const zero: MicroEntry = {
    vitamin_a_mcg: 0,
    retinol_mcg: 0,
    vitamin_c_mg: 0,
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    folate_mcg: 0,
    iron_mg: 0,
    calcium_mg: 0,
    zinc_mg: 0,
    magnesium_mg: 0,
    potassium_mg: 0,
    selenium_mcg: 0,
    iodine_mcg: 0,
    saturated_fat_g: 0,
    salt_g: 0,
    sugar_g: 0,
  };
  return entries.reduce((acc, entry) => {
    return Object.fromEntries(
      Object.entries(acc).map(([k, v]) => [k, v + (entry[k as keyof MicroEntry] ?? 0)]),
    ) as MicroEntry;
  }, zero);
}
