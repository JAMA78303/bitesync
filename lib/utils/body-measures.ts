/** Conversion helpers — canonical storage is kg + cm (TDEE / profile). */

const KG_PER_LB = 0.45359237;
const LB_PER_STONE = 14;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Whole stones + remainder pounds (UK typical entry). */
export function kgToStLb(kg: number): { st: number; lb: number } {
  const totalLb = kgToLb(kg);
  const st = Math.floor(totalLb / LB_PER_STONE);
  const lb = Math.round((totalLb - st * LB_PER_STONE) * 10) / 10;
  return { st, lb };
}

export function stLbToKg(st: number, lb: number): number {
  return lbToKg(st * LB_PER_STONE + lb);
}

export function cmToM(cm: number): number {
  return Math.round((cm / 100) * 1000) / 1000;
}

export function mToCm(m: number): number {
  return m * 100;
}

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inch = Math.round((totalInches - ft * 12) * 10) / 10;
  return { ft, inch };
}

export function ftInToCm(ft: number, inch: number): number {
  return (ft * 12 + inch) * 2.54;
}
