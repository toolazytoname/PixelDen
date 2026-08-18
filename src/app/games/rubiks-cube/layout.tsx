import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D 魔方 — Pixel Den",
  description: "可交互 3D 魔方，单层旋转，一键复原",
};

export default function CubeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
