export type MicroEntry = {
  vitamin_a_mcg: number;
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
  "brown rice": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 9, iron_mg: 0.8, calcium_mg: 10, zinc_mg: 1.1, magnesium_mg: 44, potassium_mg: 79, selenium_mcg: 14, iodine_mcg: 1, saturated_fat_g: 0.2, salt_g: 0, sugar_g: 0,
  },
  "white rice": {
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, folate_mcg: 4, iron_mg: 0.2, calcium_mg: 9, zinc_mg: 0.5, magnesium_mg: 12, potassium_mg: 29, selenium_mcg: 9, iodine_mcg: 1, saturated_fat_g: 0.1, salt_g: 0, sugar_g: 0,
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
};

export function lookupMicros(name: string): MicroEntry | null {
  const key = name.toLowerCase().trim();
  if (MICRO_DB[key]) return MICRO_DB[key];
  const aliases: Record<string, string> = {
    egg: "eggs",
    "greek yogurt": "greek yoghurt",
    "natural yogurt": "greek yoghurt",
    "natural yoghurt": "greek yoghurt",
    "bell pepper": "red pepper",
    peppers: "red pepper",
    "red peppers": "red pepper",
    carrot: "carrots",
    tomato: "tomatoes",
    tomatoes: "tomatoes",
    tuna: "tuna canned",
    "salmon fillet": "salmon",
    "beef": "beef mince",
    "mince": "beef mince",
    "turkey": "turkey breast",
    rocket: "spinach",
    lettuce: "spinach",
  };
  const aliased = aliases[key];
  return aliased ? (MICRO_DB[aliased] ?? null) : null;
}

export function scaleMicros(micros: MicroEntry, quantityG: number): MicroEntry {
  const scale = quantityG / 100;
  return Object.fromEntries(Object.entries(micros).map(([k, v]) => [k, v * scale])) as MicroEntry;
}

export function sumMicros(entries: MicroEntry[]): MicroEntry {
  const zero: MicroEntry = {
    vitamin_a_mcg: 0,
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
