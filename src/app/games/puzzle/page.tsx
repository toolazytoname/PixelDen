import GameCard from "@/components/GameCard";

const GAMES = [
  {
    id: "snake",
    title: "贪吃蛇",
    category: "puzzle",
    description: "经典贪吃蛇，吃豆变长别撞墙",
    gradient: "from-green-600 to-emerald-500",
    featured: false,
    players: "1",
    tags: ["益智", "经典"],
  },
  {
    id: "breakout",
    title: "打砖块",
    category: "puzzle",
    description: "弹球消砖块，消掉所有砖块获胜",
    gradient: "from-purple-600 to-pink-500",
    featured: false,
    players: "1",
    tags: ["益智", "弹球"],
  },
];

export default function PuzzleGames() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">益智游戏</h1>
        <p className="mt-2 text-foreground/60">动脑又动手，越玩越聪明</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
