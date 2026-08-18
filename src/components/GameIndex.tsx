import Link from "next/link";
import { FACE_HEX } from "@/lib/cube";
import { GAMES } from "@/lib/catalog";

const COPY: Record<string, { kicker: string; line: string; short: string }> = {
  raiden: { kicker: "射击", line: "直向卷轴，一波接一波", short: "雷电" },
  "rubiks-cube": { kicker: "益智", line: "色块上滑动转一层", short: "魔方" },
  "dna-helix": { kicker: "科学", line: "点碱基对看结构", short: "DNA 双螺旋" },
};

const NET = ["U", "L", "F", "R", "B", "D"] as const;

function CubeSwatch() {
  return (
    <span className="row-mark row-mark-net" aria-hidden="true">
      {NET.map((face) => (
        <i key={face} data-face={face} style={{ background: FACE_HEX[face] }} />
      ))}
    </span>
  );
}

function DnaSwatch() {
  return (
    <span className="row-mark row-mark-dna" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export default function GameIndex({
  ids,
  size = "board",
}: {
  ids?: string[];
  size?: "board" | "compact";
}) {
  const list = (ids ?? GAMES.map((game) => game.id))
    .map((id) => GAMES.find((game) => game.id === id))
    .filter((game): game is (typeof GAMES)[number] => Boolean(game));

  if (list.length === 0) return null;

  return (
    <div className={`game-board game-board-${size}`}>
      {list.map((game, index) => {
        const copy = COPY[game.id];
        return (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className={`game-row${index === 0 && size === "board" ? " game-row-main" : ""}`}
            data-game={game.id}
          >
            <span className="game-row-lead">
              {game.id === "rubiks-cube" ? (
                <CubeSwatch />
              ) : game.id === "dna-helix" ? (
                <DnaSwatch />
              ) : null}
              <span className="game-row-copy">
                <h2>{copy.short}</h2>
                <p>{copy.line}</p>
              </span>
            </span>
            <span className="game-row-meta">
              <span>{copy.kicker}</span>
              <span className="game-row-go">打开</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
