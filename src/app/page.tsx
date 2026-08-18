import GameIndex from "@/components/GameIndex";
import { GAMES } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-intro">
        <h1 className="home-title">Pixel Den</h1>
        <p className="home-lede">想到了就做成能玩的。浏览器打开就能玩。</p>
      </header>
      <GameIndex ids={GAMES.map((game) => game.id)} />
    </div>
  );
}
