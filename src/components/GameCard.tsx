interface Game {
  id: string;
  title: string;
  category: string;
  description: string;
  gradient: string;
  featured?: boolean;
  players: string;
  tags: string[];
}

interface GameCardProps {
  game: Game;
}

const CATEGORY_BADGE: Record<string, string> = {
  shooter: "badge-shooter",
  action: "badge-action",
  puzzle: "badge-puzzle",
  science: "badge-science",
};

const CATEGORY_LABEL: Record<string, string> = {
  shooter: "射击",
  action: "动作",
  puzzle: "益智",
  science: "科学",
};

const CATEGORY_ICONS: Record<string, string> = {
  shooter: "from-red-950/60 to-red-900/30",
  action: "from-amber-950/60 to-amber-900/30",
  puzzle: "from-violet-950/60 to-violet-900/30",
  science: "from-teal-950/60 to-cyan-900/30",
};

const CATEGORY_SYMBOLS: Record<string, string> = {
  shooter: "A",
  action: "B",
  puzzle: "3",
  science: "∞",
};

export default function GameCard({ game }: GameCardProps) {
  return (
    <a href={`/games/${game.id}`} className="game-card group">
      <div
        className={`card-preview bg-gradient-to-br ${CATEGORY_ICONS[game.category] ?? "from-gray-900/60 to-gray-800/30"}`}
      >
        <span className="text-3xl font-bold text-white/20 group-hover:text-white/40 transition-colors font-mono tracking-wider">
          {CATEGORY_SYMBOLS[game.category] ?? "?"}
        </span>
      </div>

      <div className="card-info">
        <h3 className="card-title group-hover:text-accent transition-colors">
          {game.title}
        </h3>
        <p className="card-desc">{game.description}</p>
        <div className="card-meta">
          <span className={`badge ${CATEGORY_BADGE[game.category] ?? ""}`}>
            {CATEGORY_LABEL[game.category] ?? game.category}
          </span>
          <span className="text-xs text-foreground/30">{game.players}P</span>
        </div>
      </div>
    </a>
  );
}
