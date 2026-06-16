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

export default function Home() {
  return (
    <>
      {/* Hero */}
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
        </div>
      </section>

      {/* Game grid */}
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
