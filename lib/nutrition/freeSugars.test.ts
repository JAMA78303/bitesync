import { sugarGramsTowardFreeSugarLimit } from "@/lib/nutrition/freeSugars";

function assertEq(actual: number, expected: number, label: string): void {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

assertEq(sugarGramsTowardFreeSugarLimit("banana", 12), 0, "whole fruit excluded");
assertEq(sugarGramsTowardFreeSugarLimit("greek yogurt", 5.4), 0, "lactose excluded");
assertEq(sugarGramsTowardFreeSugarLimit("tomato", 4), 0, "vegetable excluded");
assertEq(sugarGramsTowardFreeSugarLimit("honey", 8), 8, "added sugar counts");
assertEq(sugarGramsTowardFreeSugarLimit("peanut butter", 2.3), 2.3, "spread counts");
assertEq(sugarGramsTowardFreeSugarLimit("wholemeal bread", 5.8), 5.8, "bread counts");

// Plurals are whole fruit too (the regex used to need the exact singular).
assertEq(sugarGramsTowardFreeSugarLimit("strawberries", 4.9), 0, "strawberries excluded");
assertEq(sugarGramsTowardFreeSugarLimit("strawberry", 4.9), 0, "strawberry excluded");
assertEq(sugarGramsTowardFreeSugarLimit("apples", 11.8), 0, "apples excluded");
assertEq(sugarGramsTowardFreeSugarLimit("blueberries", 10), 0, "blueberries excluded");
assertEq(sugarGramsTowardFreeSugarLimit("raspberries", 4.4), 0, "raspberries excluded");
assertEq(sugarGramsTowardFreeSugarLimit("cherries", 14.6), 0, "cherries excluded");
assertEq(sugarGramsTowardFreeSugarLimit("peaches", 8.4), 0, "peaches excluded");
assertEq(sugarGramsTowardFreeSugarLimit("2 ripe bananas", 24), 0, "bananas excluded");

// Juices, preserves and syrups are free sugars even when they name a fruit or vegetable.
assertEq(sugarGramsTowardFreeSugarLimit("apple juice", 9.7), 9.7, "apple juice counts");
assertEq(sugarGramsTowardFreeSugarLimit("orange juice", 8.6), 8.6, "orange juice counts");
assertEq(sugarGramsTowardFreeSugarLimit("tomato juice", 3), 3, "vegetable juice counts");
assertEq(sugarGramsTowardFreeSugarLimit("juice of 1 lemon", 2.5), 2.5, "lemon juice counts");
assertEq(sugarGramsTowardFreeSugarLimit("strawberry jam", 69), 69, "jam counts");
assertEq(sugarGramsTowardFreeSugarLimit("lemon curd", 52.5), 52.5, "lemon curd counts");
assertEq(sugarGramsTowardFreeSugarLimit("tomato ketchup", 27.5), 27.5, "ketchup counts");
assertEq(sugarGramsTowardFreeSugarLimit("mango smoothie", 12), 12, "smoothie counts");

// Lactose is still excluded.
assertEq(sugarGramsTowardFreeSugarLimit("semi skimmed milk", 5), 0, "milk excluded");

console.log("freeSugars.test.ts: all assertions passed");
