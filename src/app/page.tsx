import Image from "next/image";
import Link from "next/link";
import { GAMES } from "@/lib/catalog";

export default function Home() {
  const featured = GAMES.find((game) => game.featured) ?? GAMES[0];

  return (
    <div className="den-home">
      <section className="den-hero">
        <Image
          src="/den/raiden.jpg"
          alt="夜空里一架战机拖着橙焰爬升"
          fill
          priority
          sizes="100vw"
          className="den-photo"
        />
        <div className="den-hero-scrim" aria-hidden="true" />
        <div className="den-hero-copy">
          <h1>Pixel Den</h1>
          <p>想到了就做成能玩的。</p>
          <Link href={`/games/${featured.id}`} className="den-cta">
            打开雷电
          </Link>
        </div>
      </section>

      <section className="den-pair">
        <Link href="/games/rubiks-cube" className="den-poster">
          <Image
            src="/den/cube.jpg"
            alt="灯下的三阶魔方"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 60vw"
            className="den-photo"
          />
          <span className="den-poster-copy">
            <h2>魔方</h2>
            <p>色块上滑动转一层</p>
          </span>
        </Link>
        <Link href="/games/dna-helix" className="den-poster den-poster-dna">
          <Image
            src="/den/dna.jpg"
            alt="工作台上的玻璃双螺旋模型"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 40vw"
            className="den-photo"
          />
          <span className="den-poster-copy">
            <h2>DNA 双螺旋</h2>
            <p>点碱基对看结构</p>
          </span>
        </Link>
      </section>
    </div>
  );
}
