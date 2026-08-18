export type GameCategory = "shooter" | "science" | "puzzle";

export interface GameInfo {
  id: string;
  title: string;
  category: GameCategory;
  description: string;
  gradient: string;
  featured: boolean;
  players: string;
  tags: string[];
}

export const GAMES: GameInfo[] = [
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

export function gamesByCategory(category: GameCategory): GameInfo[] {
  return GAMES.filter((game) => game.category === category);
}
