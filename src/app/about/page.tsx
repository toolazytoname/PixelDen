import Link from "next/link";
import GameCard from "@/components/GameCard";

const GAMES = [
  {
    id: "raiden",
    title: "雷电",
    category: "shooter",
    description: "经典直向卷轴射击，驾驶战机横扫千军",
    gradient: "from-red-600 to-orange-500",
    featured: true,
    players: "1",
    tags: ["射击", "经典"],
  },
  {
    id: "dna-helix",
    title: "DNA 双螺旋",
    category: "science",
    description: "交互式 3D DNA 双螺旋，点击碱基对查看细节",
    gradient: "from-teal-600 to-cyan-500",
    featured: false,
    players: "1",
    tags: ["科学", "3D"],
  },
  {
    id: "rubiks-cube",
    title: "3D 魔方",
    category: "puzzle",
    description: "可交互 3D 魔方，单层旋转，一键复原",
    gradient: "from-violet-600 to-purple-500",
    featured: false,
    players: "1",
    tags: ["益智", "3D"],
  },
];

export const metadata = {
  title: "关于 Pixel Den",
  description: "Pixel Den 是一个个人小游戏实验室，有意思的想法直接做成游戏。",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="mb-16">
        <span className="hero-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          About
        </span>
        <h1 className="hero-title mt-3">Pixel Den</h1>
        <p className="hero-desc" style={{ maxWidth: 560 }}>
          一个个人小游戏实验室。这里存放有意思的想法 — 想到了，就直接做成游戏。
          不追求数量，只追求每个作品都值得玩。
        </p>
      </section>

      {/* Philosophy */}
      <section className="mb-16">
        <div className="section-header">
          <h2 className="section-title">理念</h2>
          <div className="section-divider" />
        </div>
        <div className="philosophy-grid">
          <div className="philosophy-card">
            <h3 className="philosophy-label">想法 → 游戏</h3>
            <p className="philosophy-text">
              脑子里冒出一个有趣的机制、视觉创意或者交互方式，不写文档不画原型，直接上手做。
              游戏本身就是最好的验证方式。
            </p>
          </div>
          <div className="philosophy-card">
            <h3 className="philosophy-label">少而精</h3>
            <p className="philosophy-text">
              不追求数量堆砌。每个游戏都代表一个完整的技术探索 — Canvas 2D、Three.js、
              物理模拟、粒子系统。做完一个，才算数。
            </p>
          </div>
          <div className="philosophy-card">
            <h3 className="philosophy-label">即开即玩</h3>
            <p className="philosophy-text">
              不需要下载、注册、登录。浏览器打开就能玩。这是网页游戏的尊严。
            </p>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="mb-16">
        <div className="section-header">
          <h2 className="section-title">技术栈</h2>
          <div className="section-divider" />
        </div>
        <div className="stack-grid">
          <div className="stack-item">
            <span className="stack-name">Next.js 16</span>
            <span className="stack-role">App Router, Turbopack</span>
          </div>
          <div className="stack-item">
            <span className="stack-name">React 19</span>
            <span className="stack-role">TypeScript</span>
          </div>
          <div className="stack-item">
            <span className="stack-name">Tailwind CSS 4</span>
            <span className="stack-role">CSS design system</span>
          </div>
          <div className="stack-item">
            <span className="stack-name">Three.js</span>
            <span className="stack-role">3D rendering</span>
          </div>
          <div className="stack-item">
            <span className="stack-name">Canvas 2D</span>
            <span className="stack-role">Shooter games</span>
          </div>
          <div className="stack-item">
            <span className="stack-name">Vercel</span>
            <span className="stack-role">Deployment</span>
          </div>
        </div>
      </section>

      {/* Games */}
      <section className="mb-16">
        <div className="section-header">
          <h2 className="section-title">当前游戏</h2>
          <div className="section-divider" />
        </div>
        <div className="games-grid">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="about-cta">
          <h3 className="about-cta-title">保持关注</h3>
          <p className="about-cta-desc">
            新游戏会在有想法时陆续上线。没有时间表，只有完成品。
          </p>
          <Link href="/" className="hero-cta">
            浏览游戏
          </Link>
        </div>
      </section>
    </>
  );
}
