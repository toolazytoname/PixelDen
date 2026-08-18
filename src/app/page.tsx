import Link from "next/link";
import GameCard from "@/components/GameCard";
import { GAMES } from "@/lib/catalog";

export default function Home() {
  return (
    <>
      <section className="hero-banner mb-12">
        <div className="relative z-10">
          <span className="hero-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            精选小游戏
          </span>
          <h1 className="hero-title mt-3">Pixel Den</h1>
          <p className="hero-desc">
            一个个人小游戏实验室。有意思的想法，直接做成游戏。即开即玩，没有多余的门槛。
          </p>
          <Link href="/games/raiden" className="hero-cta">
            打开雷电
          </Link>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">全部游戏</h2>
          <div className="section-divider" />
        </div>
        <div className="games-grid">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </>
  );
}
