import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  applyMoves,
  createSolvedCubies,
  FACE_COLORS,
  FACE_MAP,
  dominantFaceNormal,
  faceIndexToNormal,
  faceNormalVector,
  generateScramble,
  inferLayerTurn,
  isSolved,
  recordMove,
  rotateLayer,
  solveFromHistory,
} from "./cube";

describe("3D 魔方 logic (shipped by /games/rubiks-cube)", () => {
  test("page uses FACE_MAP, generateScramble, recordMove, solveFromHistory", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/games/rubiks-cube/page.tsx"), "utf8");
    expect(page).toContain('from "@/lib/cube"');
    expect(page).toContain("generateScramble");
    expect(page).toContain("recordMove");
    expect(page).toContain("solveFromHistory");
    expect(page).toContain("FACE_MAP");
    expect(page).toContain("inferLayerTurn");
    expect(existsSync(path.join(process.cwd(), "src/app/games/rubiks-cube/page.tsx"))).toBe(true);
  });

  test("standard face colors are present", () => {
    expect(FACE_COLORS.right).toBe(0xc0392b);
    expect(FACE_COLORS.left).toBe(0xe67e22);
    expect(FACE_COLORS.top).toBe(0xf1c40f);
    expect(FACE_COLORS.bottom).toBe(0xecf0f1);
    expect(FACE_COLORS.front).toBe(0x27ae60);
    expect(FACE_COLORS.back).toBe(0x2980b9);
    expect(Object.keys(FACE_MAP)).toEqual(
      expect.arrayContaining(["R", "R'", "L", "L'", "U", "U'", "D", "D'", "F", "F'", "B", "B'"]),
    );
  });

  test("a layer turn then its inverse restores a solved cube", () => {
    const face = FACE_MAP.R;
    const turned = rotateLayer(createSolvedCubies(), {
      axis: face.axis,
      layer: face.layer,
      dir: face.cw,
    });
    expect(isSolved(turned)).toBe(false);

    const restored = rotateLayer(turned, {
      axis: face.axis,
      layer: face.layer,
      dir: -face.cw,
    });
    expect(isSolved(restored)).toBe(true);
  });

  test("打乱 then 复原 restores a solved cube", () => {
    let history: ReturnType<typeof recordMove> = [];
    let seed = 20260817;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const moves = generateScramble(20, random);
    expect(moves).toHaveLength(20);

    for (const move of moves) {
      history = recordMove(history, move);
    }

    const scrambled = applyMoves(createSolvedCubies(), history);
    expect(isSolved(scrambled)).toBe(false);

    const undo = solveFromHistory(history);
    expect(undo).toHaveLength(20);
    expect(undo[0].dir).toBe(-history[history.length - 1].dir);
    expect(undo[0].axis).toBe(history[history.length - 1].axis);

    const solved = applyMoves(scrambled, undo);
    expect(isSolved(solved)).toBe(true);
  });

  test("dragging a front face infers the layer turn", () => {
    expect(faceIndexToNormal(8)).toEqual({ axis: "z", sign: 1 });
    const front = { x: 1, y: 2, z: 2 };
    const right = inferLayerTurn(front, { axis: "z", sign: 1 }, { x: 20, y: 0, z: 0 });
    expect(right).toEqual({ axis: "y", layer: 2, dir: 1 });
    const left = inferLayerTurn(front, { axis: "z", sign: 1 }, { x: -20, y: 0, z: 0 });
    expect(left).toEqual({ axis: "y", layer: 2, dir: -1 });
    const up = inferLayerTurn(front, { axis: "z", sign: 1 }, { x: 0, y: 20, z: 0 });
    expect(up?.axis).toBe("x");
    expect(up?.layer).toBe(1);
  });

  test("a rotated cubie face uses the world-facing normal", () => {
    const local = faceNormalVector(faceIndexToNormal(8));
    expect(local).toEqual({ x: 0, y: 0, z: 1 });
    // 90° around Y: +Z becomes +X
    const world = { x: local.z, y: local.y, z: -local.x };
    expect(dominantFaceNormal(world.x, world.y, world.z)).toEqual({ axis: "x", sign: 1 });
  });
});
