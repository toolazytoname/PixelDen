"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  applyBomb,
  CANVAS_H,
  CANVAS_W,
  createWorld,
  FEATURED_SUBTITLE,
  FEATURED_TITLE,
  pauseGame,
  resumeGame,
  returnToMenu,
  startGame,
  tickWorld,
  type Enemy,
  type Player,
  type PowerUp,
  type World,
} from "@/lib/raiden";

function drawPlayerShip(ctx: CanvasRenderingContext2D, p: Player) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.hurtTimer > 0 && Math.floor(p.hurtTimer / 3) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  const flicker = 0.55 + 0.45 * Math.sin(Date.now() / 70);
  const plume = ctx.createLinearGradient(0, 12, 0, 36);
  plume.addColorStop(0, `rgba(255, 92, 42, ${0.9 * flicker})`);
  plume.addColorStop(1, "rgba(255, 92, 42, 0)");
  ctx.fillStyle = plume;
  ctx.beginPath();
  ctx.moveTo(-7, 12);
  ctx.lineTo(0, 34 + flicker * 8);
  ctx.lineTo(7, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6b7288";
  ctx.beginPath();
  ctx.moveTo(-28, 10);
  ctx.lineTo(-9, -8);
  ctx.lineTo(-6, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(28, 10);
  ctx.lineTo(9, -8);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e8ecf4";
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(-9, 6);
  ctx.lineTo(-5, 16);
  ctx.lineTo(5, 16);
  ctx.lineTo(9, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2a3142";
  ctx.fillRect(-14, 3, 6, 9);
  ctx.fillRect(8, 3, 6, 9);

  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(-4.5, -2);
  ctx.lineTo(4.5, -2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff5c2a";
  ctx.fillRect(-13, -2, 4, 5);
  ctx.fillRect(9, -2, 4, 5);

  if (p.shield > 0) {
    ctx.strokeStyle = `rgba(74, 222, 128, ${0.45 + 0.3 * Math.sin(Date.now() / 120)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const a = Math.max(0.35, e.hp / e.maxHp);
  ctx.globalAlpha = a;

  if (e.type === "scout") {
    ctx.fillStyle = "#c2410c";
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(-11, -6);
    ctx.lineTo(-4, -2);
    ctx.lineTo(0, -14);
    ctx.lineTo(4, -2);
    ctx.lineTo(11, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fdba74";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-3, -4);
    ctx.lineTo(3, -4);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === "fighter") {
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(-16, -4, 10, 16);
    ctx.fillRect(6, -4, 10, 16);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-14, -2);
    ctx.lineTo(-6, -12);
    ctx.lineTo(6, -12);
    ctx.lineTo(14, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fecaca";
    ctx.fillRect(-3, -8, 6, 10);
  } else if (e.type === "heavy") {
    ctx.fillStyle = "#3b0764";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, -8);
    ctx.lineTo(16, 10);
    ctx.lineTo(0, 18);
    ctx.lineTo(-16, 10);
    ctx.lineTo(-16, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(-18, -3, 8, 8);
    ctx.fillRect(10, -3, 8, 8);
    ctx.fillStyle = "#ddd6fe";
    ctx.fillRect(-5, -6, 10, 10);
  } else if (e.type === "boss") {
    ctx.fillStyle = "#450a0a";
    ctx.beginPath();
    ctx.moveTo(-46, 8);
    ctx.lineTo(-30, -18);
    ctx.lineTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(30, -18);
    ctx.lineTo(46, 8);
    ctx.lineTo(28, 22);
    ctx.lineTo(-28, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-20, -6, 40, 18);
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(-8, -14, 16, 8);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(-e.width / 2, -e.height / 2 - 12, e.width, 5);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-e.width / 2, -e.height / 2 - 12, e.width * (e.hp / e.maxHp), 5);
  }

  ctx.restore();
}

function drawBullet(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; radius: number; color: string },
) {
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

function drawBackdrop(ctx: CanvasRenderingContext2D, stars: { x: number; y: number; speed: number; size: number; brightness: number }[]) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, "#0a0a12");
  sky.addColorStop(0.72, "#101018");
  sky.addColorStop(1, "#1a1210");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  stars.forEach((s) => {
    s.y += s.speed;
    if (s.y > CANVAS_H) {
      s.y = 0;
      s.x = Math.random() * CANVAS_W;
    }
    ctx.fillStyle = `rgba(238,238,240,${s.brightness})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  ctx.fillStyle = "rgba(255, 92, 42, 0.06)";
  ctx.fillRect(0, CANVAS_H - 90, CANVAS_W, 90);
}

export default function RaidenGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<World["phase"]>("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(100);
  const [bombCount, setBombCount] = useState(3);
  const maxHp = 100;

  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  const starsRef = useRef<
    { x: number; y: number; speed: number; size: number; brightness: number }[]
  >([]);
  const touchRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 80; i++) {
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

  const syncHud = useCallback((world: World) => {
    setScore(world.score);
    setLevel(world.level);
    setHp(world.player.hp);
    setBombCount(world.player.bombs);
    setGameState(world.phase);
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;

    let raf = 0;
    const frame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const world = worldRef.current;

      if (world.phase !== "playing") {
        drawBackdrop(ctx, starsRef.current);
        return;
      }

      tickWorld(world, { keys: keysRef.current, touch: touchRef.current });
      syncHud(world);

      drawBackdrop(ctx, starsRef.current);

      world.powerUps.forEach((pu) => drawPowerUp(ctx, pu));
      world.bullets.forEach((b) => drawBullet(ctx, b));
      world.enemies.forEach((e) => drawEnemy(ctx, e));
      if (world.phase === "playing") {
        drawPlayerShip(ctx, world.player);
      }

      world.particles.forEach((pt) => {
        const alpha = pt.life / pt.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, CANVAS_W, 36);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${world.score.toString().padStart(8, "0")}`, 10, 23);

      ctx.textAlign = "right";
      ctx.fillText(`W${world.wave}`, CANVAS_W - 10, 23);

      if (world.bannerTimer > 0 && world.banner) {
        const fade = Math.min(1, world.bannerTimer / 18);
        ctx.globalAlpha = fade;
        ctx.fillStyle = world.banner === "WARNING" ? "#ff5c2a" : "#eeeef0";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(world.banner, CANVAS_W / 2, CANVAS_H * 0.38);
        ctx.globalAlpha = 1;
      }

      const hpBarW = 100;
      const hpBarX = CANVAS_W - hpBarW - 10;
      const hpBarY = 28;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(hpBarX, hpBarY, hpBarW, 4);
      const hpRatio = Math.max(0, world.player.hp / world.player.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#fbbf24" : "#ef4444";
      ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, 4);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [gameState, syncHud]);

  const handleBomb = useCallback(() => {
    const world = worldRef.current;
    if (world.phase !== "playing") return;
    if (applyBomb(world)) {
      setBombCount(world.player.bombs);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "Space") e.preventDefault();
      if (e.key === "b" || e.key === "B") handleBomb();
      if (e.key === "Escape" && worldRef.current.phase === "playing") {
        pauseGame(worldRef.current);
        setGameState("paused");
      }
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
  }, [handleBomb]);

  const handleStart = () => {
    startGame(worldRef.current);
    syncHud(worldRef.current);
  };

  const handleResume = () => {
    resumeGame(worldRef.current);
    setGameState("playing");
  };

  const handleMenu = () => {
    returnToMenu(worldRef.current);
    setGameState("menu");
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
    <div>
      <Link href="/" className="page-back">
        ← 返回首页
      </Link>

      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="page-title">{FEATURED_TITLE}</h1>
          <p className="page-subtitle">{FEATURED_SUBTITLE}</p>
        </div>

        <div className="canvas-wrapper">
          <div className="game-container game-container-wide">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="cursor-default"
            />

            {gameState === "menu" && (
              <div className="overlay-menu">
                <div className="text-center">
                  <h2 className="overlay-title">{FEATURED_TITLE}</h2>
                  <p className="overlay-subtitle">一波接一波 · 白机对橙蜂</p>
                  <button onClick={handleStart} className="overlay-btn">
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

            {gameState === "paused" && (
              <div className="overlay-paused">
                <h2 className="text-3xl font-bold text-white mb-6">暂停</h2>
                <button onClick={handleResume} className="overlay-btn">
                  继续
                </button>
                <button
                  onClick={handleMenu}
                  className="mt-3 text-sm text-foreground/50 hover:text-accent transition-colors"
                >
                  返回主页
                </button>
              </div>
            )}

            {gameState === "gameover" && (
              <div className="overlay-menu">
                <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
                <p className="text-2xl font-mono text-accent mb-6">{score.toLocaleString()}</p>
                <p className="text-sm text-foreground/50 mb-6">波次 {level}</p>
                <button onClick={handleStart} className="overlay-btn">
                  再来一局
                </button>
                <button
                  onClick={handleMenu}
                  className="mt-3 text-sm text-foreground/50 hover:text-accent transition-colors"
                >
                  返回主页
                </button>
              </div>
            )}
          </div>

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
                      background:
                        hp / maxHp > 0.5 ? "#4ade80" : hp / maxHp > 0.25 ? "#fbbf24" : "#ef4444",
                    }}
                  />
                </div>
                <span className="stat-value" style={{ color: "var(--text-primary)" }}>
                  {hp}/{maxHp}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="stat-label">炸弹</span>
                <span className="stat-value" style={{ color: "#fbbf24" }}>
                  ×{bombCount}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="touch-controls">
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
          <button onTouchStart={handleBomb} className="touch-btn touch-btn-fire">
            炸弹 (B)
          </button>
        </div>

        <div className="hidden max-w-md rounded-xl border border-border bg-card p-4 text-sm text-foreground/60 md:block">
          <h3 className="mb-2 font-semibold text-foreground">操作说明</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <kbd className="rounded bg-border px-1.5 py-0.5 text-xs">WASD</kbd> /{" "}
              <kbd className="rounded bg-border px-1.5 py-0.5 text-xs">方向键</kbd> 移动
            </div>
            <div>自动射击</div>
            <div>
              <kbd className="rounded bg-border px-1.5 py-0.5 text-xs">B</kbd> 炸弹
            </div>
            <div>
              <kbd className="rounded bg-border px-1.5 py-0.5 text-xs">ESC</kbd> 暂停
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
