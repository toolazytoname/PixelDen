import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  buildPairModels,
  pairAt,
  pairSelectionPayload,
  PAIR_TYPES,
  selectPair,
  TOTAL_PAIRS,
} from "./dna";

describe("DNA pair model (shipped by /games/dna-helix)", () => {
  test("page calls pairAt, selectPair, and pairSelectionPayload", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/games/dna-helix/page.tsx"), "utf8");
    expect(page).toContain('from "@/lib/dna"');
    expect(page).toContain("pairAt");
    expect(page).toContain("selectPair");
    expect(page).toContain("pairSelectionPayload");
    expect(page).toContain("buildPairModels");
    expect(page).toContain("pickPair");
    expect(existsSync(path.join(process.cwd(), "src/app/games/dna-helix/page.tsx"))).toBe(true);
  });

  test("helix is A–T / G–C pairs only", () => {
    const pairs = buildPairModels();
    expect(pairs.length).toBe(TOTAL_PAIRS);
    expect(pairs.length).toBeGreaterThan(4);

    for (const pair of pairs) {
      expect(PAIR_TYPES).toContain(pair.pairType);
      if (pair.base1 === "A") {
        expect(pair.base2).toBe("T");
        expect(pair.pairType).toBe("A-T");
        expect(pair.description).toMatch(/腺嘌呤-胸腺嘧啶/);
      } else {
        expect(pair.base1).toBe("G");
        expect(pair.base2).toBe("C");
        expect(pair.pairType).toBe("G-C");
        expect(pair.description).toMatch(/鸟嘌呤-胞嘧啶/);
      }
    }

    expect(pairs.some((pair) => pair.pairType === "A-T")).toBe(true);
    expect(pairs.some((pair) => pair.pairType === "G-C")).toBe(true);
  });

  test("selecting a pair surfaces that pair's bases and description", () => {
    const pairs = buildPairModels();
    const at = pairs.find((pair) => pair.pairType === "A-T");
    const gc = pairs.find((pair) => pair.pairType === "G-C");
    expect(at && gc).toBeTruthy();
    if (!at || !gc) return;

    expect(selectPair(pairs, at.pairIndex)).toEqual(at);
    const atPayload = pairSelectionPayload(at);
    expect(atPayload.bases).toBe("A-T");
    expect(atPayload.base1).toBe("A");
    expect(atPayload.base2).toBe("T");
    expect(atPayload.description).toBe(at.description);

    const gcPayload = pairSelectionPayload(pairAt(gc.pairIndex));
    expect(gcPayload.bases).toBe("G-C");
    expect(gcPayload.description).toBe(gc.description);
    expect(selectPair(pairs, 9999)).toBeNull();
  });
});
