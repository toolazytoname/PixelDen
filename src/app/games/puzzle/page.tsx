import GameCard from "@/components/GameCard";
import { gamesByCategory } from "@/lib/catalog";

export const metadata = {
  title: "益智 — Pixel Den",
  description: "Pixel Den 当前可玩的益智游戏",
};

export default function PuzzleGames() {
  const games = gamesByCategory("puzzle");

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">益智游戏</h1>
        <p className="page-subtitle">当前可玩的益智作品</p>
      </div>
      <div className="games-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </>
  );
}
