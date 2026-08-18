import GameIndex from "@/components/GameIndex";
import { GAMES } from "@/lib/catalog";

export default function Home() {
  return (
    <div className="home-page">
      <h1 className="sr-only">Pixel Den</h1>
      <p className="home-lede">想到了就做成能玩的。</p>
      <GameIndex ids={GAMES.map((game) => game.id)} />
    </div>
  );
}
