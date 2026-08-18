export const FEATURED_TITLE = "雷电";
export const FEATURED_SUBTITLE = "认清敌机 · 一波一波来";
export const CANVAS_W = 400;
export const CANVAS_H = 700;
export const PLAYER_SPEED = 6;
export const FIRE_RATE_DEFAULT = 8;
export const HURT_IFRAMES = 36;

export type WaveKind = "swarm" | "vee" | "wall" | "pincer" | "boss";
export type WavePhase = "intro" | "active" | "rest";
export type WaveControl = "auto" | "manual";
export type EnemyPattern = "dive" | "sine" | "strafe" | "hold";

export type GamePhase = "menu" | "playing" | "paused" | "gameover";
export type CraftId = "falcon" | "crow" | "kite";
export type SfxEvent =
  | "shot"
  | "explode"
  | "hurt"
  | "pickup"
  | "wave"
  | "boss"
  | "clear"
  | "die";

export interface CraftSpec {
  id: CraftId;
  name: string;
  line: string;
  shot: "twin" | "fan" | "needle";
  speed: number;
  hp: number;
  fireRate: number;
  bombs: number;
  card: string;
}

export const CRAFTS: CraftSpec[] = [
  {
    id: "falcon",
    name: "白隼",
    line: "双管速射，均衡",
    shot: "twin",
    speed: 6,
    hp: 100,
    fireRate: 8,
    bombs: 3,
    card: "/den/craft-falcon.jpg",
  },
  {
    id: "crow",
    name: "赤鸦",
    line: "扇形弹幕，偏慢",
    shot: "fan",
    speed: 4.6,
    hp: 120,
    fireRate: 10,
    bombs: 4,
    card: "/den/craft-crow.jpg",
  },
  {
    id: "kite",
    name: "青鸢",
    line: "细针连射，偏快",
    shot: "needle",
    speed: 7.4,
    hp: 80,
    fireRate: 5,
    bombs: 2,
    card: "/den/craft-kite.jpg",
  },
];

export function craftById(id: CraftId): CraftSpec {
  return CRAFTS.find((craft) => craft.id === id) ?? CRAFTS[0];
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  friendly: boolean;
  color: string;
}

export interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  score: number;
  type: "scout" | "fighter" | "heavy" | "boss";
  shootTimer: number;
  shootInterval: number;
  path: Vec2[];
  pathIndex: number;
  color: string;
  width: number;
  height: number;
  vx: number;
  pattern: EnemyPattern;
  age: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: "spread" | "speed" | "shield" | "bomb";
  speed: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  shield: number;
  fireRate: number;
  fireTimer: number;
  powerLevel: number;
  hasSpread: boolean;
  spreadTimer: number;
  bombs: number;
  hurtTimer: number;
  craft: CraftId;
}

export interface TouchState {
  x: number;
  y: number;
  active: boolean;
}

export interface World {
  phase: GamePhase;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  level: number;
  enemySpawnTimer: number;
  difficulty: number;
  wave: number;
  wavePhase: WavePhase;
  waveTimer: number;
  waveKind: WaveKind;
  waveControl: WaveControl;
  banner: string;
  bannerTimer: number;
}

export interface TickInput {
  keys: Set<string>;
  touch: TouchState;
  now?: number;
  random?: () => number;
}

export function createPlayer(craftId: CraftId = "falcon"): Player {
  const craft = craftById(craftId);
  return {
    x: CANVAS_W / 2,
    y: CANVAS_H - 110,
    width: 40,
    height: 40,
    speed: craft.speed,
    hp: craft.hp,
    maxHp: craft.hp,
    shield: 0,
    fireRate: craft.fireRate,
    fireTimer: 0,
    powerLevel: 1,
    hasSpread: false,
    spreadTimer: 0,
    bombs: craft.bombs,
    hurtTimer: 0,
    craft: craft.id,
  };
}

export function createWorld(): World {
  return {
    phase: "menu",
    player: createPlayer("falcon"),
    bullets: [],
    enemies: [],
    particles: [],
    powerUps: [],
    score: 0,
    level: 1,
    enemySpawnTimer: 0,
    difficulty: 1,
    wave: 1,
    wavePhase: "intro",
    waveTimer: 80,
    waveKind: "swarm",
    waveControl: "auto",
    banner: "",
    bannerTimer: 0,
  };
}

export function startGame(world: World, craft: CraftId = "falcon"): void {
  world.phase = "playing";
  world.player = createPlayer(craft);
  world.bullets = [];
  world.enemies = [];
  world.particles = [];
  world.powerUps = [];
  world.score = 0;
  world.level = 1;
  world.enemySpawnTimer = 0;
  world.difficulty = 1;
  world.waveControl = "auto";
  beginWave(world, 1);
}

export function pauseGame(world: World): void {
  if (world.phase === "playing") world.phase = "paused";
}

export function resumeGame(world: World): void {
  if (world.phase === "paused") world.phase = "playing";
}

export function returnToMenu(world: World): void {
  world.phase = "menu";
}

export function makeEnemy(partial: Partial<Enemy> = {}): Enemy {
  return {
    x: CANVAS_W / 2,
    y: 80,
    hp: 3,
    maxHp: 3,
    speed: 0,
    score: 100,
    type: "scout",
    shootTimer: 9999,
    shootInterval: 90,
    path: [],
    pathIndex: 0,
    color: "#fb923c",
    width: 24,
    height: 24,
    vx: 0,
    pattern: "dive",
    age: 0,
    ...partial,
  };
}

export function spawnParticles(
  world: World,
  x: number,
  y: number,
  count: number,
  color: string,
  speed = 3,
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: 1 + Math.random() * 3,
    });
  }
}

export function spawnEnemy(world: World, random: () => number = Math.random): void {
  const r = random();
  if (r < 0.5) {
    world.enemies.push(makeScout(30 + random() * (CANVAS_W - 60), -30, world.level, random));
  } else if (r < 0.85) {
    world.enemies.push(makeFighter(40 + random() * (CANVAS_W - 80), -30, world.level, random));
  } else {
    world.enemies.push(makeHeavy(60 + random() * (CANVAS_W - 120), -40, world.level));
  }
}

function makeScout(x: number, y: number, lvl: number, random: () => number): Enemy {
  return makeEnemy({
    x,
    y,
    hp: 1 + Math.floor(lvl / 3),
    maxHp: 1 + Math.floor(lvl / 3),
    speed: 1.8 + random() * 0.4,
    score: 100,
    type: "scout",
    shootTimer: 70 + random() * 40,
    shootInterval: 100,
    color: "#fb923c",
    width: 30,
    height: 32,
    vx: (random() - 0.5) * 0.6,
    pattern: "sine",
  });
}

function makeFighter(x: number, y: number, lvl: number, random: () => number): Enemy {
  return makeEnemy({
    x,
    y,
    hp: 3 + lvl,
    maxHp: 3 + lvl,
    speed: 1.05 + random() * 0.25,
    score: 300,
    type: "fighter",
    shootTimer: 36 + random() * 24,
    shootInterval: 54,
    color: "#ef4444",
    width: 36,
    height: 30,
    vx: 0,
    pattern: "strafe",
  });
}

function makeHeavy(x: number, y: number, lvl: number): Enemy {
  return makeEnemy({
    x,
    y,
    hp: 8 + lvl * 2,
    maxHp: 8 + lvl * 2,
    speed: 0.55,
    score: 600,
    type: "heavy",
    shootTimer: 28,
    shootInterval: 42,
    color: "#8b5cf6",
    width: 44,
    height: 42,
    vx: 0,
    pattern: "hold",
  });
}

export function spawnBoss(world: World): void {
  world.enemies.push(
    makeEnemy({
      x: CANVAS_W / 2,
      y: -70,
      hp: 50 + world.level * 20,
      maxHp: 50 + world.level * 20,
      speed: 0.7,
      score: 5000,
      type: "boss",
      shootTimer: 24,
      shootInterval: 28,
      color: "#dc2626",
      width: 92,
      height: 68,
      vx: 1.1,
      pattern: "hold",
    }),
  );
}

export function waveKindFor(wave: number): WaveKind {
  if (wave % 3 === 0) return "boss";
  const kinds: WaveKind[] = ["swarm", "vee", "wall", "pincer"];
  return kinds[(wave - 1) % 4];
}

export function beginWave(world: World, wave: number): void {
  world.wave = wave;
  world.level = wave;
  world.difficulty = 1 + wave * 0.15;
  world.waveKind = waveKindFor(wave);
  world.wavePhase = "intro";
  world.waveTimer = 54;
  world.banner = world.waveKind === "boss" ? "WARNING" : `WAVE ${wave}`;
  world.bannerTimer = 54;
}

export function spawnWave(world: World, kind: WaveKind, random: () => number = Math.random): void {
  const lvl = world.level;
  if (kind === "swarm") {
    for (let i = 0; i < 6; i++) {
      const x = 50 + i * 50 + (i % 2 === 0 ? -8 : 8);
      world.enemies.push(makeScout(x, -20 - i * 12, lvl, random));
    }
    return;
  }
  if (kind === "vee") {
    const xs = [200, 150, 250, 100, 300];
    xs.forEach((x, i) => {
      world.enemies.push(makeFighter(x, -36 - i * 22, lvl, random));
    });
    return;
  }
  if (kind === "wall") {
    for (let i = 0; i < 3; i++) {
      world.enemies.push(makeHeavy(80 + i * 120, -50, lvl));
    }
    return;
  }
  if (kind === "pincer") {
    world.enemies.push(makeHeavy(56, -40, lvl));
    world.enemies.push(makeHeavy(344, -40, lvl));
    for (let i = 0; i < 3; i++) {
      world.enemies.push(makeScout(140 + i * 60, -90 - i * 16, lvl, random));
    }
    return;
  }
  spawnBoss(world);
}

export function tickWave(world: World, random: () => number = Math.random, events: SfxEvent[] = []): void {
  if (world.waveControl !== "auto") return;
  if (world.bannerTimer > 0) world.bannerTimer--;
  world.waveTimer--;

  if (world.wavePhase === "intro") {
    if (world.waveTimer <= 0) {
      spawnWave(world, world.waveKind, random);
      world.wavePhase = "active";
      world.waveTimer = 12;
      events.push(world.waveKind === "boss" ? "boss" : "wave");
    }
    return;
  }

  if (world.wavePhase === "active") {
    if (world.enemies.length === 0 && world.waveTimer <= 0) {
      world.wavePhase = "rest";
      world.waveTimer = 64;
      world.banner = "CLEAR";
      world.bannerTimer = 48;
      events.push("clear");
    }
    return;
  }

  if (world.wavePhase === "rest" && world.waveTimer <= 0) {
    beginWave(world, world.wave + 1);
  }
}

export function firePlayerBullet(world: World): void {
  const p = world.player;
  const bulletSpeed = -10;
  const craft = craftById(p.craft);

  const baseBullet: Omit<Bullet, "vx" | "vy"> = {
    x: 0,
    y: p.y - p.height / 2,
    radius: craft.shot === "needle" ? 2 : 3,
    damage: craft.shot === "needle" ? 1 : 1,
    friendly: true,
    color: craft.shot === "fan" ? "#fb923c" : craft.shot === "needle" ? "#7dd3fc" : "#38bdf8",
  };

  if (p.hasSpread || craft.shot === "fan") {
    for (let i = -2; i <= 2; i++) {
      world.bullets.push({
        ...baseBullet,
        x: p.x + i * 8,
        vy: bulletSpeed,
        vx: i * 1.5,
      });
    }
    return;
  }

  if (craft.shot === "needle") {
    world.bullets.push({ ...baseBullet, x: p.x, vy: bulletSpeed - 2, vx: 0 });
    return;
  }

  world.bullets.push({ ...baseBullet, x: p.x - 8, vy: bulletSpeed, vx: 0 });
  world.bullets.push({ ...baseBullet, x: p.x + 8, vy: bulletSpeed, vx: 0 });
}

export function fireEnemyBullet(world: World, enemy: Enemy, angle?: number): void {
  const speed = 4;
  const a = angle ?? Math.PI / 2;
  world.bullets.push({
    x: enemy.x,
    y: enemy.y + enemy.height / 2,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    radius: 3,
    damage: 10,
    friendly: false,
    color: "#f87171",
  });
}

export function applyPickup(player: Player, type: PowerUp["type"]): void {
  switch (type) {
    case "spread":
      player.hasSpread = true;
      player.spreadTimer = 600;
      break;
    case "speed":
      player.fireRate = Math.max(3, player.fireRate - 1);
      break;
    case "shield":
      player.shield = Math.min(3, player.shield + 1);
      break;
    case "bomb":
      player.bombs = Math.min(5, player.bombs + 1);
      break;
  }
}

export function applyBomb(world: World): boolean {
  const p = world.player;
  if (p.bombs <= 0) return false;
  p.bombs--;

  // Clear hostile fire. Keeping this inverted used to leave enemy shots on screen.
  world.bullets = world.bullets.filter((b) => b.friendly);
  world.enemies.forEach((e) => {
    e.hp -= 20;
    spawnParticles(world, e.x, e.y, 10, "#fbbf24", 4);
  });
  world.enemies = world.enemies.filter((e) => e.hp > 0);

  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 100;
    world.particles.push({
      x: p.x + Math.cos(angle) * dist,
      y: p.y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      life: 40,
      maxLife: 40,
      color: "#fbbf24",
      size: 2 + Math.random() * 4,
    });
  }
  return true;
}

export function keyPressed(keys: Set<string>, ...names: string[]): boolean {
  return names.some((name) => keys.has(name));
}

export function movePlayer(player: Player, input: TickInput): void {
  let dx = 0;
  let dy = 0;
  if (keyPressed(input.keys, "ArrowLeft", "a", "A")) dx -= 1;
  if (keyPressed(input.keys, "ArrowRight", "d", "D")) dx += 1;
  if (keyPressed(input.keys, "ArrowUp", "w", "W")) dy -= 1;
  if (keyPressed(input.keys, "ArrowDown", "s", "S")) dy += 1;

  if (input.touch.active) {
    const diffX = input.touch.x - player.x;
    const diffY = input.touch.y - player.y;
    const dist = Math.sqrt(diffX * diffX + diffY * diffY);
    if (dist > 3) {
      dx = diffX / dist;
      dy = diffY / dist;
    }
  }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  player.x = Math.max(player.width / 2, Math.min(CANVAS_W - player.width / 2, player.x + dx * player.speed));
  player.y = Math.max(
    player.height / 2 + 40,
    Math.min(CANVAS_H - player.height / 2 - 32, player.y + dy * player.speed),
  );
}

function damagePlayer(world: World, amount: number): SfxEvent | null {
  const p = world.player;
  if (p.hurtTimer > 0) return null;
  if (p.shield > 0) {
    p.shield--;
    p.hurtTimer = Math.floor(HURT_IFRAMES / 2);
    return "hurt";
  }
  p.hp -= amount;
  p.hurtTimer = HURT_IFRAMES;
  if (p.hp <= 0) {
    p.hp = 0;
    world.phase = "gameover";
    return "die";
  }
  return "hurt";
}

export function updateEnemyMotion(e: Enemy, now: number): void {
  e.age += 1;
  if (e.type === "boss") {
    if (e.y < 96) e.y += e.speed;
    else e.x = CANVAS_W / 2 + Math.sin(now / 420) * 118;
    e.x = Math.max(e.width / 2 + 8, Math.min(CANVAS_W - e.width / 2 - 8, e.x));
    return;
  }

  e.y += e.speed;
  if (e.pattern === "sine") {
    e.x += Math.sin(e.age / 16) * 1.15 + e.vx;
  } else if (e.pattern === "strafe") {
    e.x += e.vx || Math.sin(e.age / 22) * 1.4;
  } else if (e.pattern === "hold") {
    if (e.y > 140) e.y -= e.speed * 0.55;
    e.x += Math.sin(e.age / 40) * 0.45;
  } else {
    e.x += e.vx;
  }
  e.x = Math.max(e.width / 2, Math.min(CANVAS_W - e.width / 2, e.x));
}

export function tickWorld(world: World, input: TickInput): SfxEvent[] {
  const events: SfxEvent[] = [];
  if (world.phase !== "playing") return events;

  const random = input.random ?? Math.random;
  const now = input.now ?? Date.now();
  const p = world.player;

  movePlayer(p, input);
  if (p.hurtTimer > 0) p.hurtTimer--;

  tickWave(world, random, events);

  p.fireTimer--;
  if (p.fireTimer <= 0) {
    firePlayerBullet(world);
    p.fireTimer = p.fireRate;
    events.push("shot");
  }

  if (p.hasSpread) {
    p.spreadTimer--;
    if (p.spreadTimer <= 0) p.hasSpread = false;
  }

  world.bullets = world.bullets.filter((b) => {
    b.x += b.vx;
    b.y += b.vy;
    return b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20;
  });

  world.enemies.forEach((e) => {
    updateEnemyMotion(e, now);
    e.shootTimer--;

    if (e.shootTimer <= 0 && e.y > 0 && e.y < CANVAS_H * 0.7) {
      if (e.type === "boss") {
        for (let i = -3; i <= 3; i++) {
          fireEnemyBullet(world, e, Math.PI / 2 + i * 0.18);
        }
      } else if (e.type === "fighter") {
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        fireEnemyBullet(world, e, angle);
      } else {
        fireEnemyBullet(world, e);
      }
      e.shootTimer = e.shootInterval;
    }
  });

  world.enemies = world.enemies.filter((e) => e.y < CANVAS_H + 50);

  world.bullets = world.bullets.filter((b) => {
    if (!b.friendly) return true;
    for (let i = world.enemies.length - 1; i >= 0; i--) {
      const e = world.enemies[i];
      if (
        Math.abs(b.x - e.x) < e.width / 2 + b.radius &&
        Math.abs(b.y - e.y) < e.height / 2 + b.radius
      ) {
        e.hp -= b.damage;
        spawnParticles(world, b.x, b.y, 3, b.color, 2);
        if (e.hp <= 0) {
          world.score += e.score;

          if (random() < 0.15) {
            const types: PowerUp["type"][] = ["spread", "speed", "shield", "bomb"];
            world.powerUps.push({
              x: e.x,
              y: e.y,
              type: types[Math.floor(random() * types.length)],
              speed: 1.5,
            });
          }

          const count = e.type === "boss" ? 60 : e.type === "heavy" ? 30 : 15;
          const color = e.type === "boss" ? "#fbbf24" : e.type === "heavy" ? "#c084fc" : "#fb923c";
          spawnParticles(world, e.x, e.y, count, color, e.type === "boss" ? 6 : 4);

          world.enemies.splice(i, 1);
          events.push("explode");
        }
        return false;
      }
    }
    return true;
  });

  world.bullets = world.bullets.filter((b) => {
    if (b.friendly) return true;
    if (Math.abs(b.x - p.x) < p.width / 2 && Math.abs(b.y - p.y) < p.height / 2) {
      if (p.shield > 0) {
        spawnParticles(world, b.x, b.y, 5, "#38bdf8", 2);
      } else {
        spawnParticles(world, b.x, b.y, 5, "#f87171", 2);
      }
      const hit = damagePlayer(world, b.damage);
      if (hit) events.push(hit);
      return false;
    }
    return true;
  });

  world.enemies = world.enemies.filter((e) => {
    if (
      Math.abs(e.x - p.x) < (e.width + p.width) / 2.5 &&
      Math.abs(e.y - p.y) < (e.height + p.height) / 2.5
    ) {
      e.hp -= 3;
      if (p.shield > 0) {
        // shield consumes one hit
      } else {
        spawnParticles(world, e.x, e.y, 8, "#fbbf24", 3);
      }
      const ram = damagePlayer(world, 15);
      if (ram) events.push(ram);
      spawnParticles(world, e.x, e.y, 8, "#fbbf24", 3);
      return e.hp > 0;
    }
    return true;
  });

  world.powerUps = world.powerUps.filter((pu) => {
    pu.y += pu.speed;
    if (Math.abs(pu.x - p.x) < 25 && Math.abs(pu.y - p.y) < 25) {
      applyPickup(p, pu.type);
      spawnParticles(world, pu.x, pu.y, 8, "#4ade80", 2);
      events.push("pickup");
      return false;
    }
    return pu.y < CANVAS_H + 20;
  });

  world.particles = world.particles.filter((pt) => {
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
    pt.life--;
    return pt.life > 0;
  });

  return events;
}
