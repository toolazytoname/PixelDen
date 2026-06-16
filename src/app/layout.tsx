import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Logo from "@/components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixel Den — 精选小游戏",
  description: "即开即玩的精选小游戏合集",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background">
        <header className="site-header">
          <div className="header-inner">
            <Logo size="md" />

            <nav className="main-nav">
              <a href="/" className="nav-link active">
                首页
              </a>
              <a href="/games/raiden" className="nav-link">
                射击
              </a>
              <a href="/games/dna-helix" className="nav-link">
                科学
              </a>
              <a href="/games/rubiks-cube" className="nav-link">
                益智
              </a>
              <a href="/about" className="nav-link">
                关于
              </a>
            </nav>

            <input
              type="text"
              placeholder="搜索游戏…"
              className="search-input"
              readOnly
            />
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-8 lg:px-12">
            {children}
          </div>
        </main>

        <footer className="site-footer">
          <div className="footer-inner">
            <p className="footer-brand">
              Pixel Den &middot; 精选小游戏 &middot; <a href="/about" style={{ color: "var(--text-muted)" }}>关于</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
