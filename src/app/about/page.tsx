import GameIndex from "@/components/GameIndex";
import { GAMES } from "@/lib/catalog";

export const metadata = {
  title: "关于 Pixel Den",
  description: "Pixel Den 是一个个人小游戏实验室，有意思的想法直接做成游戏。",
};

export default function AboutPage() {
  return (
    <div className="site-shell about-page">
      <header className="about-intro">
        <h1 className="about-title">关于</h1>
        <p className="about-lede">
          Pixel Den 是个人工坊。想到了就做成游戏，做完才算数。
        </p>
      </header>

      <section className="about-notes">
        <article>
          <h2>想法做成游戏</h2>
          <p>脑子里冒出机制或交互，直接上手。游戏本身就是验证。</p>
        </article>
        <article>
          <h2>少而精</h2>
          <p>每个作品对应一次完整的技术探索。做完一个，才算数。</p>
        </article>
        <article>
          <h2>即开即玩</h2>
          <p>不用下载，不用注册。浏览器打开就能玩。</p>
        </article>
      </section>

      <section className="about-stack">
        <h2>用到的工具</h2>
        <p>Next.js 16，React 19，Tailwind，Three.js，Canvas 2D</p>
      </section>

      <section className="about-games">
        <h2>当前能玩</h2>
        <GameIndex ids={GAMES.map((game) => game.id)} />
      </section>
    </div>
  );
}
