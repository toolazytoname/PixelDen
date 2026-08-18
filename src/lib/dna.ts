export const HELIX_TURNS = 2.5;
export const PAIRS_PER_TURN = 8;
export const TOTAL_PAIRS = HELIX_TURNS * PAIRS_PER_TURN;
export const RADIUS = 2.0;
export const VERTICAL_SPACING = 0.45;
export const BASE_SIZE = 0.18;
export const BOND_SIZE = 0.04;

export const PAIR_TYPES = ["A-T", "G-C"] as const;
export type PairType = (typeof PAIR_TYPES)[number];

export interface PairModel {
  pairIndex: number;
  pairType: PairType;
  base1: "A" | "G";
  base2: "T" | "C";
  color1: string;
  color2: string;
  description: string;
}

export function pairTypeAt(index: number): PairType {
  return index % 3 !== 0 ? "G-C" : "A-T";
}

export function pairAt(index: number): PairModel {
  const pairType = pairTypeAt(index);
  const isGC = pairType === "G-C";
  return {
    pairIndex: index,
    pairType,
    base1: isGC ? "G" : "A",
    base2: isGC ? "C" : "T",
    color1: isGC ? "#22c55e" : "#ef4444",
    color2: isGC ? "#eab308" : "#3b82f6",
    description: isGC
      ? "鸟嘌呤-胞嘧啶: 3个氢键连接，结构更稳定"
      : "腺嘌呤-胸腺嘧啶: 2个氢键连接",
  };
}

export function buildPairModels(totalPairs = TOTAL_PAIRS): PairModel[] {
  return Array.from({ length: totalPairs }, (_, index) => pairAt(index));
}

export function selectPair<T extends { pairIndex: number }>(
  pairs: T[],
  pairIndex: number,
): T | null {
  return pairs.find((pair) => pair.pairIndex === pairIndex) ?? null;
}

export function pairSelectionPayload(pair: PairModel) {
  return {
    pairIndex: pair.pairIndex,
    pairType: pair.pairType,
    bases: `${pair.base1}-${pair.base2}` as PairType,
    base1: pair.base1,
    base2: pair.base2,
    description: pair.description,
  };
}
