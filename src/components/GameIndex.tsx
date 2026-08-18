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
    <span className="tile-swatch tile-swatch-net" aria-hidden="true">
      {NET.map((face) => (
        <i key={face} data-face={face} style={{ background: FACE_HEX[face] }} />
      ))}
    </span>
  );
}

function DnaSwatch() {
  return (
    <span className="tile-swatch tile-swatch-dna" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export default function GameIndex({ ids }: { ids?: string[] }) {
  const list = (ids ?? GAMES.map((game) => game.id))
    .map((id) => GAMES.find((game) => game.id === id))
    .filter((game): game is (typeof GAMES)[number] => Boolean(game));

  if (list.length === 0) return null;

  const featured = list.find((game) => game.featured) ?? list[0];
  const rest = list.filter((game) => game.id !== featured.id);
  const featureCopy = COPY[featured.id];

  return (
    <div className={`game-index${rest.length === 0 ? " game-index-solo" : ""}`}>
      <Link href={`/games/${featured.id}`} className="game-feature">
        <span className="game-kicker">{featureCopy.kicker}</span>
        <span className="game-feature-main">
          <h2 className="game-feature-title">{featureCopy.short}</h2>
          <p className="game-feature-line">{featureCopy.line}</p>
          <span className="game-go">打开</span>
        </span>
      </Link>

      {rest.length > 0 && (
        <div className="game-side">
          {rest.map((game) => {
            const copy = COPY[game.id];
            return (
              <Link key={game.id} href={`/games/${game.id}`} className="game-item">
                {game.id === "rubiks-cube" ? <CubeSwatch /> : <DnaSwatch />}
                <span className="game-item-copy">
                  <h2>{copy.short}</h2>
                  <p>{copy.line}</p>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
