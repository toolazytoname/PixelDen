import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DNA 双螺旋 — Pixel Den",
  description: "交互式 3D DNA 双螺旋，点击碱基对查看细节",
};

export default function DnaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
