import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { GAMES, gamesByCategory } from "./catalog";
import { NAV_ITEMS, navItemActive } from "./nav";

describe("catalog and chrome routes", () => {
  test("every advertised game id has a playable page", () => {
    expect(GAMES.map((game) => game.id).sort()).toEqual(
      ["dna-helix", "raiden", "rubiks-cube"].sort(),
    );
    for (const game of GAMES) {
      const page = path.join(process.cwd(), "src/app/games", game.id, "page.tsx");
      expect(existsSync(page)).toBe(true);
    }
    expect(GAMES.some((game) => game.id === "snake" || game.id === "breakout")).toBe(false);
    expect(gamesByCategory("puzzle").every((game) => game.id === "rubiks-cube")).toBe(true);
  });

  test("home, about, and puzzle catalog import the shared catalog", () => {
    for (const file of [
      "src/app/page.tsx",
      "src/app/about/page.tsx",
      "src/app/games/puzzle/page.tsx",
    ]) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).toContain("@/lib/catalog");
      expect(source).not.toMatch(/snake|breakout/);
    }
  });

  test("nav destinations match the five user-facing routes and highlight the current path", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/games/raiden",
      "/games/dna-helix",
      "/games/rubiks-cube",
      "/about",
    ]);
    expect(navItemActive("/", "/")).toBe(true);
    expect(navItemActive("/", "/about")).toBe(false);
    expect(navItemActive("/games/raiden", "/games/raiden")).toBe(true);
    expect(navItemActive("/about", "/about")).toBe(true);
    expect(navItemActive("/games/raiden", "/games/dna-helix")).toBe(false);
  });
});
