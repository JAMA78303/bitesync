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

console.log("freeSugars.test.ts: all assertions passed");
