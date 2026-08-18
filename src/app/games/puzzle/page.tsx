import GameIndex from "@/components/GameIndex";
import { gamesByCategory } from "@/lib/catalog";

export const metadata = {
  title: "益智 — Pixel Den",
  description: "Pixel Den 当前可玩的益智游戏",
};

export default function PuzzleGames() {
  const games = gamesByCategory("puzzle");

  return (
    <div className="site-shell">
      <header className="about-intro">
        <h1 className="about-title">益智</h1>
        <p className="about-lede">当前能玩的益智作品。</p>
      </header>
      <GameIndex ids={games.map((game) => game.id)} />
    </div>
  );
}
