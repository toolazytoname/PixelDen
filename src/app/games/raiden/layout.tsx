import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "雷电 — Pixel Den",
  description: "经典直向卷轴射击，驾驶战机横扫千军",
};

export default function RaidenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
