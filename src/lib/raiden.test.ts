import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  applyBomb,
  applyPickup,
  beginWave,
  CANVAS_H,
  CANVAS_W,
  createWorld,
  FEATURED_TITLE,
  FIRE_RATE_DEFAULT,
  makeEnemy,
  pauseGame,
  resumeGame,
  spawnWave,
  startGame,
  tickWorld,
  waveKindFor,
} from "./raiden";

const idleTouch = { x: 0, y: 0, active: false };
const noSpawn = { keys: new Set<string>(), touch: idleTouch, random: () => 0.99 };

function playable(world = createWorld()) {
  startGame(world);
  world.waveControl = "manual";
  world.enemySpawnTimer = 10_000;
  world.enemies = [];
  world.bullets = [];
  world.powerUps = [];
  return world;
}

describe("雷电 engine (shipped by /games/raiden)", () => {
  test("page imports this module", () => {
    const page = path.join(process.cwd(), "src/app/games/raiden/page.tsx");
    expect(existsSync(page)).toBe(true);
    expect(FEATURED_TITLE).toBe("雷电");
  });

  test("WASD and arrows move the ship", () => {
    const right = playable();
    const originX = right.player.x;
    tickWorld(right, { keys: new Set(["ArrowRight"]), touch: idleTouch, random: () => 1 });
    expect(right.player.x).toBeGreaterThan(originX);

    const left = playable();
    tickWorld(left, { keys: new Set(["a"]), touch: idleTouch, random: () => 1 });
    expect(left.player.x).toBeLessThan(originX);

    const up = playable();
    const originY = up.player.y;
    tickWorld(up, { keys: new Set(["w"]), touch: idleTouch, random: () => 1 });
    expect(up.player.y).toBeLessThan(originY);

    const down = playable();
    tickWorld(down, { keys: new Set(["s"]), touch: idleTouch, random: () => 1 });
    expect(down.player.y).toBeGreaterThan(originY);
  });

  test("existing touch path moves the ship toward the finger", () => {
    const world = playable();
    const originX = world.player.x;
    tickWorld(world, {
      keys: new Set(),
      touch: { x: originX + 80, y: world.player.y, active: true },
      random: () => 1,
    });
    expect(world.player.x).toBeGreaterThan(originX);
  });

  test("auto-fire hits enemies", () => {
    const world = playable();
    world.player.fireTimer = 0;
    world.enemies = [
      makeEnemy({
        x: world.player.x,
        y: world.player.y - 80,
        hp: 8,
        maxHp: 8,
        width: 40,
        height: 40,
        speed: 0,
        shootTimer: 9999,
      }),
    ];

    for (let i = 0; i < 16; i++) {
      tickWorld(world, noSpawn);
    }

    const remaining = world.enemies[0];
    expect(remaining === undefined || remaining.hp < 8).toBe(true);
    expect(world.score).toBeGreaterThanOrEqual(0);
    if (!remaining) {
      expect(world.score).toBeGreaterThan(0);
    }
  });

  test("enemy shots and ramming reduce HP and reach game over", () => {
    const shot = playable();
    shot.player.shield = 0;
    shot.bullets.push({
      x: shot.player.x,
      y: shot.player.y,
      vx: 0,
      vy: 0,
      radius: 3,
      damage: 10,
      friendly: false,
      color: "#f87171",
    });
    tickWorld(shot, noSpawn);
    expect(shot.player.hp).toBe(90);

    const ram = playable();
    ram.player.shield = 0;
    ram.enemies = [
      makeEnemy({
        x: ram.player.x,
        y: ram.player.y,
        hp: 10,
        speed: 0,
        shootTimer: 9999,
      }),
    ];
    tickWorld(ram, noSpawn);
    expect(ram.player.hp).toBeLessThan(100);

    const over = playable();
    over.player.hp = 5;
    over.player.shield = 0;
    over.bullets.push({
      x: over.player.x,
      y: over.player.y,
      vx: 0,
      vy: 0,
      radius: 3,
      damage: 10,
      friendly: false,
      color: "#f87171",
    });
    tickWorld(over, noSpawn);
    expect(over.phase).toBe("gameover");
    expect(over.player.hp).toBe(0);
  });

  test("start, pause, and restart work", () => {
    const world = createWorld();
    expect(world.phase).toBe("menu");
    startGame(world);
    expect(world.phase).toBe("playing");
    expect(world.player.hp).toBe(100);

    const x = world.player.x;
    pauseGame(world);
    expect(world.phase).toBe("paused");
    tickWorld(world, { keys: new Set(["d"]), touch: idleTouch });
    expect(world.player.x).toBe(x);

    resumeGame(world);
    expect(world.phase).toBe("playing");
    tickWorld(world, { keys: new Set(["d"]), touch: idleTouch, random: () => 1 });
    expect(world.player.x).toBeGreaterThan(x);

    world.player.hp = 12;
    world.score = 900;
    startGame(world);
    expect(world.phase).toBe("playing");
    expect(world.player.hp).toBe(100);
    expect(world.score).toBe(0);
    expect(world.player.x).toBe(CANVAS_W / 2);
    expect(world.player.y).toBe(CANVAS_H - 110);
  });

  test("craft cards change speed and shot pattern", () => {
    const kite = createWorld();
    startGame(kite, "kite");
    expect(kite.player.speed).toBeGreaterThan(6);
    expect(kite.player.craft).toBe("kite");
    kite.waveControl = "manual";
    kite.player.fireTimer = 0;
    kite.bullets = [];
    tickWorld(kite, noSpawn);
    expect(kite.bullets.filter((b) => b.friendly)).toHaveLength(1);

    const crow = createWorld();
    startGame(crow, "crow");
    crow.waveControl = "manual";
    crow.player.fireTimer = 0;
    crow.bullets = [];
    tickWorld(crow, noSpawn);
    expect(crow.bullets.filter((b) => b.friendly).length).toBeGreaterThanOrEqual(5);
  });

  test("bomb clears hostile fire and damages enemies", () => {
    const world = playable();
    world.player.bombs = 2;
    world.bullets = [
      {
        x: 40,
        y: 40,
        vx: 0,
        vy: -4,
        radius: 3,
        damage: 1,
        friendly: true,
        color: "#38bdf8",
      },
      {
        x: 80,
        y: 80,
        vx: 0,
        vy: 4,
        radius: 3,
        damage: 10,
        friendly: false,
        color: "#f87171",
      },
    ];
    world.enemies = [makeEnemy({ hp: 25, maxHp: 25, x: 100, y: 100 })];

    expect(applyBomb(world)).toBe(true);
    expect(world.player.bombs).toBe(1);
    expect(world.bullets.every((b) => b.friendly)).toBe(true);
    expect(world.bullets.some((b) => !b.friendly)).toBe(false);
    expect(world.enemies).toHaveLength(1);
    expect(world.enemies[0].hp).toBe(5);
    expect(world.shake).toBeGreaterThan(0);
    expect(world.flash).toBeGreaterThan(0);

    world.player.bombs = 0;
    expect(applyBomb(world)).toBe(false);
  });

  test("pickups apply spread, speed, shield, and bomb", () => {
    const world = playable();
    applyPickup(world.player, "spread");
    expect(world.player.hasSpread).toBe(true);
    applyPickup(world.player, "speed");
    expect(world.player.fireRate).toBeLessThan(FIRE_RATE_DEFAULT);
    applyPickup(world.player, "shield");
    expect(world.player.shield).toBe(1);
    const bombs = world.player.bombs;
    applyPickup(world.player, "bomb");
    expect(world.player.bombs).toBe(bombs + 1);

    world.powerUps = [{ x: world.player.x, y: world.player.y, type: "shield", speed: 0 }];
    tickWorld(world, noSpawn);
    expect(world.player.shield).toBe(2);
    expect(world.powerUps).toHaveLength(0);
  });

  test("waves have a start, a roster, and a clear", () => {
    expect(waveKindFor(1)).toBe("swarm");
    expect(waveKindFor(3)).toBe("boss");

    const world = createWorld();
    startGame(world);
    expect(world.wave).toBe(1);
    expect(world.wavePhase).toBe("intro");
    expect(world.banner).toMatch(/WAVE/);

    world.enemies = [];
    spawnWave(world, "swarm", () => 0.2);
    expect(world.enemies.length).toBeGreaterThan(3);
    expect(world.enemies.every((enemy) => enemy.type === "scout")).toBe(true);

    world.enemies = [];
    spawnWave(world, "boss", () => 0.2);
    expect(world.enemies.some((enemy) => enemy.type === "boss")).toBe(true);

    beginWave(world, 2);
    expect(world.level).toBe(2);
    expect(world.wavePhase).toBe("intro");

    for (let i = 0; i < 90; i++) {
      tickWorld(world, noSpawn);
    }
    expect(world.wavePhase).toBe("active");
    expect(world.enemies.length).toBeGreaterThan(0);
  });

  test("kills build a combo and score popup", () => {
    const world = playable();
    world.player.fireTimer = 0;
    world.enemies = [
      makeEnemy({
        x: world.player.x,
        y: world.player.y - 24,
        hp: 1,
        maxHp: 1,
        width: 40,
        height: 40,
        speed: 0,
        shootTimer: 9999,
        score: 100,
      }),
    ];
    tickWorld(world, noSpawn);
    tickWorld(world, noSpawn);
    expect(world.combo).toBeGreaterThan(0);
    expect(world.popups.length).toBeGreaterThan(0);
    expect(world.score).toBeGreaterThanOrEqual(100);
  });
});
