"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface Vec2 {
  x: number;
  y: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  friendly: boolean;
  color: string;
}

interface Enemy {
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
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: "spread" | "speed" | "shield" | "bomb";
  speed: number;
}

interface Player {
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
}

// ─── Constants ───────────────────────────────────────────────────────
const FEATURED_TITLE = "雷电";
const FEATURED_SUBTITLE = "RAIDEN — Vertical Scrolling Shooter";
const CANVAS_W = 400;
const CANVAS_H = 700;
const PLAYER_SPEED = 6;
const FIRE_RATE_DEFAULT = 8;
const STAR_COUNT = 80;

// ─── Drawing helpers ─────────────────────────────────────────────────
function drawPlayerShip(ctx: CanvasRenderingContext2D, p: Player) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Engine glow
  const glowGrad = ctx.createRadialGradient(0, p.height / 2 + 4, 0, 0, p.height / 2 + 4, 18);
  glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
  glowGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(-18, p.height / 2 - 4, 36, 24);

  // Body
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(0, -p.height / 2);
  ctx.lineTo(-p.width / 2, p.height / 2);
  ctx.lineTo(-p.width / 6, p.height / 3);
  ctx.lineTo(0, p.height / 2.5);
  ctx.lineTo(p.width / 6, p.height / 3);
  ctx.lineTo(p.width / 2, p.height / 2);
  ctx.closePath();
  ctx.fill();

  // Wings
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.moveTo(-p.width / 2, p.height / 2);
  ctx.lineTo(-p.width / 2 - 10, p.height / 2 - 5);
  ctx.lineTo(-p.width / 3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p.width / 2, p.height / 2);
  ctx.lineTo(p.width / 2 + 10, p.height / 2 - 5);
  ctx.lineTo(p.width / 3, 0);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "#bae6fd";
  ctx.beginPath();
  ctx.ellipse(0, -4, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shield overlay
  if (p.shield > 0) {
    ctx.strokeStyle = `rgba(74, 222, 128, ${0.4 + 0.3 * Math.sin(Date.now() / 100)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2 + 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const alpha = e.hp / e.maxHp;

  if (e.type === "scout") {
    ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -e.height / 2);
    ctx.lineTo(-e.width / 2, e.height / 2);
    ctx.lineTo(e.width / 2, e.height / 2);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === "fighter") {
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
    ctx.fillStyle = `rgba(252, 165, 165, ${alpha})`;
    ctx.fillRect(-e.width / 4, -e.height / 4, e.width / 2, e.height / 2);
  } else if (e.type === "heavy") {
    ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -e.height / 2);
    ctx.lineTo(e.width / 2, 0);
    ctx.lineTo(0, e.height / 2);
    ctx.lineTo(-e.width / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (e.type === "boss") {
    ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
    ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
    ctx.fillStyle = `rgba(252, 165, 165, ${alpha})`;
    ctx.fillRect(-e.width / 3, -e.height / 3, e.width * 2 / 3, e.height * 2 / 3);
    // Boss HP bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(-e.width / 2, -e.height / 2 - 10, e.width, 6);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-e.width / 2, -e.height / 2 - 10, e.width * alpha, 6);
  }

  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
  const icons: Record<string, string> = {
    spread: "S",
    speed: "F",
    shield: "◆",
    bomb: "B",
  };
  const colors: Record<string, string> = {
    spread: "#fbbf24",
    speed: "#34d399",
    shield: "#38bdf8",
    bomb: "#f87171",
  };
  ctx.save();
  ctx.translate(pu.x, pu.y);
  ctx.fillStyle = colors[pu.type] || "#fff";
  ctx.shadowColor = colors[pu.type] || "#fff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icons[pu.type] || "?", 0, 0);
  ctx.restore();
}

// ─── Main Component ──────────────────────────────────────────────────
export default function RaidenGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(100);
  const [maxHp] = useState(100);
  const [bombCount, setBombCount] = useState(3);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<Player>({
    x: CANVAS_W / 2,
    y: CANVAS_H - 80,
    width: 40,
    height: 40,
    speed: PLAYER_SPEED,
    hp: 100,
    maxHp: 100,
    shield: 0,
    fireRate: FIRE_RATE_DEFAULT,
    fireTimer: 0,
    powerLevel: 1,
    hasSpread: false,
    spreadTimer: 0,
    bombs: 3,
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const enemySpawnTimerRef = useRef(0);
  const difficultyRef = useRef(1);
  const animFrameRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Init stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        speed: 0.5 + Math.random() * 2,
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, speed: number = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      particlesRef.current.push({
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
  }, []);

  const spawnEnemy = useCallback(() => {
    const r = Math.random();
    let enemy: Enemy;
    const lvl = levelRef.current;

    if (r < 0.5) {
      // Scout
      enemy = {
        x: 30 + Math.random() * (CANVAS_W - 60),
        y: -30,
        hp: 1 + Math.floor(lvl / 3),
        maxHp: 1 + Math.floor(lvl / 3),
        speed: 1.5 + Math.random(),
        score: 100,
        type: "scout",
        shootTimer: 60 + Math.random() * 60,
        shootInterval: 90,
        path: [],
        pathIndex: 0,
        color: "#fb923c",
        width: 24,
        height: 24,
      };
    } else if (r < 0.85) {
      // Fighter
      enemy = {
        x: 40 + Math.random() * (CANVAS_W - 80),
        y: -30,
        hp: 3 + lvl,
        maxHp: 3 + lvl,
        speed: 0.8 + Math.random() * 0.5,
        score: 300,
        type: "fighter",
        shootTimer: 40 + Math.random() * 40,
        shootInterval: 60,
        path: [],
        pathIndex: 0,
        color: "#ef4444",
        width: 32,
        height: 28,
      };
    } else {
      // Heavy
      enemy = {
        x: 60 + Math.random() * (CANVAS_W - 120),
        y: -40,
        hp: 8 + lvl * 2,
        maxHp: 8 + lvl * 2,
        speed: 0.4 + Math.random() * 0.3,
        score: 600,
        type: "heavy",
        shootTimer: 30,
        shootInterval: 45,
        path: [],
        pathIndex: 0,
        color: "#8b5cf6",
        width: 40,
        height: 40,
      };
    }

    enemiesRef.current.push(enemy);
  }, [spawnParticles]);

  const spawnBoss = useCallback(() => {
    enemiesRef.current.push({
      x: CANVAS_W / 2,
      y: -60,
      hp: 50 + levelRef.current * 20,
      maxHp: 50 + levelRef.current * 20,
      speed: 0.3,
      score: 5000,
      type: "boss",
      shootTimer: 20,
      shootInterval: 25,
      path: [],
      pathIndex: 0,
      color: "#dc2626",
      width: 80,
      height: 60,
    });
  }, []);

  const firePlayerBullet = useCallback(() => {
    const p = playerRef.current;
    const bulletSpeed = -10;

    const baseBullet: Omit<Bullet, "vx" | "vy"> = {
      x: 0,
      y: p.y - p.height / 2,
      radius: 3,
      damage: 1,
      friendly: true,
      color: "#38bdf8",
    };

    if (p.hasSpread) {
      // Spread shot
      for (let i = -2; i <= 2; i++) {
        bulletsRef.current.push({
          ...baseBullet,
          x: p.x + i * 8,
          vy: bulletSpeed,
          vx: i * 1.5,
        });
      }
    } else {
      // Normal dual shot
      bulletsRef.current.push({ ...baseBullet, x: p.x - 8, vy: bulletSpeed, vx: 0 });
      bulletsRef.current.push({ ...baseBullet, x: p.x + 8, vy: bulletSpeed, vx: 0 });
    }
  }, []);

  const fireEnemyBullet = useCallback((e: Enemy, angle?: number) => {
    const speed = 4;
    const a = angle ?? Math.PI / 2;
    bulletsRef.current.push({
      x: e.x,
      y: e.y + e.height / 2,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      radius: 3,
      damage: 10,
      friendly: false,
      color: "#f87171",
    });
  }, []);

  const useBomb = useCallback(() => {
    const p = playerRef.current;
    if (p.bombs <= 0) return;
    p.bombs--;
    setBombCount(p.bombs);

    // Clear all bullets and damage all enemies
    bulletsRef.current = bulletsRef.current.filter((b) => !b.friendly);
    enemiesRef.current.forEach((e) => {
      e.hp -= 20;
      spawnParticles(e.x, e.y, 10, "#fbbf24", 4);
    });
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);

    // Big flash effect
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 100;
      particlesRef.current.push({
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
  }, [spawnParticles]);

  // ─── Game Loop ───────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (gameStateRef.current !== "playing") {
      // Still draw background when paused/menu
      ctx.fillStyle = "#0f0f1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      starsRef.current.forEach((s) => {
        s.y += s.speed;
        if (s.y > CANVAS_H) {
          s.y = 0;
          s.x = Math.random() * CANVAS_W;
        }
        ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const p = playerRef.current;
    const keys = keysRef.current;

    // ── Update ──

    // Player movement
    let dx = 0, dy = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
    if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
    if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

    // Touch movement
    if (touchRef.current.active) {
      const targetX = touchRef.current.x;
      const targetY = touchRef.current.y;
      const diffX = targetX - p.x;
      const diffY = targetY - p.y;
      const dist = Math.sqrt(diffX * diffX + diffY * diffY);
      if (dist > 3) {
        dx = diffX / dist;
        dy = diffY / dist;
      }
    }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    p.x = Math.max(p.width / 2, Math.min(CANVAS_W - p.width / 2, p.x + dx * p.speed));
    p.y = Math.max(p.height / 2, Math.min(CANVAS_H - p.height / 2, p.y + dy * p.speed));

    // Auto-fire
    p.fireTimer--;
    if (p.fireTimer <= 0) {
      firePlayerBullet();
      p.fireTimer = p.fireRate;
    }

    // Spread timer
    if (p.hasSpread) {
      p.spreadTimer--;
      if (p.spreadTimer <= 0) p.hasSpread = false;
    }

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      return b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20;
    });

    // Spawn enemies
    enemySpawnTimerRef.current--;
    if (enemySpawnTimerRef.current <= 0) {
      spawnEnemy();
      enemySpawnTimerRef.current = Math.max(20, 60 - levelRef.current * 5);
    }

    // Update enemies
    enemiesRef.current.forEach((e) => {
      e.y += e.speed;
      e.shootTimer--;

      // Boss horizontal movement
      if (e.type === "boss") {
        e.x += Math.sin(Date.now() / 500) * 1.5;
      }

      // Enemy shooting
      if (e.shootTimer <= 0 && e.y > 0 && e.y < CANVAS_H * 0.7) {
        if (e.type === "boss") {
          // Boss shoots fan
          for (let i = -3; i <= 3; i++) {
            fireEnemyBullet(e, Math.PI / 2 + i * 0.2);
          }
        } else {
          fireEnemyBullet(e);
        }
        e.shootTimer = e.shootInterval;
      }
    });

    // Remove off-screen enemies
    enemiesRef.current = enemiesRef.current.filter((e) => e.y < CANVAS_H + 50);

    // Collision: player bullets vs enemies
    bulletsRef.current = bulletsRef.current.filter((b) => {
      if (!b.friendly) return true;
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        if (
          Math.abs(b.x - e.x) < e.width / 2 + b.radius &&
          Math.abs(b.y - e.y) < e.height / 2 + b.radius
        ) {
          e.hp -= b.damage;
          spawnParticles(b.x, b.y, 3, b.color, 2);
          if (e.hp <= 0) {
            scoreRef.current += e.score;
            setScore(scoreRef.current);

            // Drop power-up chance
            if (Math.random() < 0.15) {
              const types: PowerUp["type"][] = ["spread", "speed", "shield", "bomb"];
              powerUpsRef.current.push({
                x: e.x,
                y: e.y,
                type: types[Math.floor(Math.random() * types.length)],
                speed: 1.5,
              });
            }

            // Explosion
            const count = e.type === "boss" ? 60 : e.type === "heavy" ? 30 : 15;
            const color = e.type === "boss" ? "#fbbf24" : e.type === "heavy" ? "#c084fc" : "#fb923c";
            spawnParticles(e.x, e.y, count, color, e.type === "boss" ? 6 : 4);

            enemiesRef.current.splice(i, 1);

            // Level up every 5000 score
            if (scoreRef.current > 0 && scoreRef.current % 5000 === 0) {
              levelRef.current++;
              setLevel(levelRef.current);
              difficultyRef.current = 1 + levelRef.current * 0.2;
              if (levelRef.current % 3 === 0) {
                spawnBoss();
              }
            }
          }
          return false;
        }
      }
      return true;
    });

    // Collision: enemy bullets vs player
    bulletsRef.current = bulletsRef.current.filter((b) => {
      if (b.friendly) return true;
      if (
        Math.abs(b.x - p.x) < p.width / 2 &&
        Math.abs(b.y - p.y) < p.height / 2
      ) {
        if (p.shield > 0) {
          p.shield--;
          spawnParticles(b.x, b.y, 5, "#38bdf8", 2);
        } else {
          p.hp -= b.damage;
          setHp(Math.max(0, p.hp));
          spawnParticles(b.x, b.y, 5, "#f87171", 2);
          if (p.hp <= 0) {
            setGameState("gameover");
          }
        }
        return false;
      }
      return true;
    });

    // Collision: enemies vs player (ramming)
    enemiesRef.current = enemiesRef.current.filter((e) => {
      if (
        Math.abs(e.x - p.x) < (e.width + p.width) / 2.5 &&
        Math.abs(e.y - p.y) < (e.height + p.height) / 2.5
      ) {
        e.hp -= 3;
        if (p.shield > 0) {
          p.shield--;
        } else {
          p.hp -= 15;
          setHp(Math.max(0, p.hp));
          if (p.hp <= 0) setGameState("gameover");
        }
        spawnParticles(e.x, e.y, 8, "#fbbf24", 3);
        return e.hp > 0;
      }
      return true;
    });

    // Collision: power-ups vs player
    powerUpsRef.current = powerUpsRef.current.filter((pu) => {
      pu.y += pu.speed;
      if (
        Math.abs(pu.x - p.x) < 25 &&
        Math.abs(pu.y - p.y) < 25
      ) {
        switch (pu.type) {
          case "spread":
            p.hasSpread = true;
            p.spreadTimer = 600;
            break;
          case "speed":
            p.fireRate = Math.max(3, p.fireRate - 1);
            break;
          case "shield":
            p.shield = Math.min(3, p.shield + 1);
            break;
          case "bomb":
            p.bombs = Math.min(5, p.bombs + 1);
            setBombCount(p.bombs);
            break;
        }
        spawnParticles(pu.x, pu.y, 8, "#4ade80", 2);
        return false;
      }
      return pu.y < CANVAS_H + 20;
    });

    // Update particles
    particlesRef.current = particlesRef.current.filter((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life--;
      return pt.life > 0;
    });

    // ── Draw ──
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    starsRef.current.forEach((s) => {
      s.y += s.speed;
      if (s.y > CANVAS_H) {
        s.y = 0;
        s.x = Math.random() * CANVAS_W;
      }
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Grid lines (subtle)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }

    // Power-ups
    powerUpsRef.current.forEach((pu) => drawPowerUp(ctx, pu));

    // Bullets
    bulletsRef.current.forEach((b) => drawBullet(ctx, b));

    // Enemies
    enemiesRef.current.forEach((e) => drawEnemy(ctx, e));

    // Player
    if (gameStateRef.current === "playing") {
      drawPlayerShip(ctx, p);
    }

    // Particles
    particlesRef.current.forEach((pt) => {
      const alpha = pt.life / pt.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_W, 36);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${scoreRef.current.toString().padStart(8, "0")}`, 10, 23);

    ctx.textAlign = "right";
    ctx.fillText(`LV.${levelRef.current}`, CANVAS_W - 10, 23);

    // HP bar
    const hpBarW = 100;
    const hpBarX = CANVAS_W - hpBarW - 10;
    const hpBarY = 28;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(hpBarX, hpBarY, hpBarW, 4);
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#fbbf24" : "#ef4444";
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, 4);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [firePlayerBullet, fireEnemyBullet, spawnEnemy, spawnBoss, spawnParticles, setGameState]);

  // ─── Effect: Game loop start/stop ──────────────────────────────
  useEffect(() => {
    if (gameState === "playing") {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameLoop]);

  // ─── Effect: Keyboard input ────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "Space") e.preventDefault();
      if (e.key === "b" || e.key === "B") useBomb();
      if (e.key === "Escape" && gameState === "playing") setGameState("paused");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameState, useBomb]);

  // ─── Handlers ──────────────────────────────────────────────────
  const startGame = () => {
    playerRef.current = {
      x: CANVAS_W / 2,
      y: CANVAS_H - 80,
      width: 40,
      height: 40,
      speed: PLAYER_SPEED,
      hp: 100,
      maxHp: 100,
      shield: 0,
      fireRate: FIRE_RATE_DEFAULT,
      fireTimer: 0,
      powerLevel: 1,
      hasSpread: false,
      spreadTimer: 0,
      bombs: 3,
    };
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    enemySpawnTimerRef.current = 0;
    difficultyRef.current = 1;
    setScore(0);
    setLevel(1);
    setHp(100);
    setBombCount(3);
    setGameState("playing");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const touch = e.touches[0];
    touchRef.current = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
      active: true,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const touch = e.touches[0];
    touchRef.current.x = (touch.clientX - rect.left) * scaleX;
    touchRef.current.y = (touch.clientY - rect.top) * scaleY;
  };

  const handleTouchEnd = () => {
    touchRef.current.active = false;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-8 lg:px-12">
      {/* Back button */}
      <a href="/" className="page-back">← 返回首页</a>

      <div className="flex flex-col items-center gap-6">
        {/* Game title */}
        <div className="text-center">
          <h1 className="page-title">{FEATURED_TITLE}</h1>
          <p className="page-subtitle">{FEATURED_SUBTITLE}</p>
        </div>

        {/* Game canvas */}
        <div className="canvas-wrapper">
          <div className="game-container game-container-wide">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="cursor-crosshair"
            />

            {/* Overlay: Menu */}
            {gameState === "menu" && (
              <div className="overlay-menu">
                <div className="text-center">
                  <h2 className="overlay-title">{FEATURED_TITLE}</h2>
                  <p className="overlay-subtitle">RAIDEN SHOOTER</p>
                  <button
                    onClick={startGame}
                    className="overlay-btn"
                  >
                    开始游戏
                  </button>
                </div>
                <div className="overlay-controls">
                  <p>键盘: WASD/方向键移动 · 自动射击</p>
                  <p>B 使用炸弹 · ESC 暂停</p>
                  <p>移动端: 触摸拖动控制飞机</p>
                </div>
              </div>
            )}

            {/* Overlay: Paused */}
            {gameState === "paused" && (
              <div className="overlay-paused">
                <h2 className="text-3xl font-bold text-white mb-6">暂停</h2>
                <button
                  onClick={() => setGameState("playing")}
                  className="overlay-btn"
                >
                  继续
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="mt-3 text-sm text-foreground/50 hover:text-accent transition-colors"
                >
                  返回主页
                </button>
              </div>
            )}

            {/* Overlay: Game Over */}
            {gameState === "gameover" && (
              <div className="overlay-menu">
                <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
                <p className="text-2xl font-mono text-accent mb-6">
                  {scoreRef.current.toLocaleString()}
                </p>
                <p className="text-sm text-foreground/50 mb-6">
                  等级 {levelRef.current}
                </p>
                <button
                  onClick={startGame}
                  className="overlay-btn"
                >
                  再来一局
                </button>
                <button
                  onClick={() => setGameState("menu")}
                  className="mt-3 text-sm text-foreground/50 hover:text-accent transition-colors"
                >
                  返回主页
                </button>
              </div>
            )}
          </div>

          {/* HUD stats */}
          {gameState === "playing" && (
            <div className="stats-bar">
              <div className="flex items-center gap-4">
                <span className="stat-label">分数</span>
                <span className="stat-value">{score.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="stat-label">HP</span>
                <div className="hp-bar-track">
                  <div
                    className="hp-bar-fill"
                    style={{
                      width: `${(hp / maxHp) * 100}%`,
                      background: hp / maxHp > 0.5 ? "#4ade80" : hp / maxHp > 0.25 ? "#fbbf24" : "#ef4444",
                    }}
                  />
                </div>
                <span className="stat-value" style={{ color: "var(--text-primary)" }}>{hp}/{maxHp}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="stat-label">炸弹</span>
                <span className="stat-value" style={{ color: "#fbbf24" }}>×{bombCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Touch controls for mobile */}
        <div className="touch-controls md:hidden">
          <button
            onTouchStart={() => keysRef.current.add("ArrowLeft")}
            onTouchEnd={() => keysRef.current.delete("ArrowLeft")}
            className="touch-btn"
          >
            ◀
          </button>
          <button
            onTouchStart={() => keysRef.current.add("ArrowRight")}
            onTouchEnd={() => keysRef.current.delete("ArrowRight")}
            className="touch-btn"
          >
            ▶
          </button>
          <button
            onTouchStart={() => keysRef.current.add("ArrowUp")}
            onTouchEnd={() => keysRef.current.delete("ArrowUp")}
            className="touch-btn"
          >
            ▲
          </button>
          <button
            onTouchStart={() => keysRef.current.add("ArrowDown")}
            onTouchEnd={() => keysRef.current.delete("ArrowDown")}
            className="touch-btn"
          >
            ▼
          </button>
          <button
            onTouchStart={() => {
              if (playerRef.current.bombs > 0) useBomb();
            }}
            className="touch-btn touch-btn-fire"
          >
            炸弹 (B)
          </button>
        </div>

        {/* Controls info */}
        <div className="hidden max-w-md rounded-xl border border-border bg-card p-4 text-sm text-foreground/60 md:block">
          <h3 className="mb-2 font-semibold text-foreground">操作说明</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><kbd className="rounded bg-border px-1.5 py-0.5 text-xs">WASD</kbd> / <kbd className="rounded bg-border px-1.5 py-0.5 text-xs">方向键</kbd> 移动</div>
            <div>自动射击</div>
            <div><kbd className="rounded bg-border px-1.5 py-0.5 text-xs">B</kbd> 炸弹</div>
            <div><kbd className="rounded bg-border px-1.5 py-0.5 text-xs">ESC</kbd> 暂停</div>
          </div>
        </div>
      </div>
    </div>
  );
}
