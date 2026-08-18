"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { NAV_ITEMS, navItemActive } from "@/lib/nav";

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          href="/"
          className="logo-link"
          aria-label="Pixel Den 首页"
          onClick={() => setOpen(false)}
        >
          <Logo size="md" />
        </Link>

        <nav className="main-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${navItemActive(item.href, pathname) ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
        </button>
      </div>

      <nav
        id="mobile-nav"
        className={`mobile-nav${open ? " open" : ""}`}
        aria-label="移动导航"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${navItemActive(item.href, pathname) ? " active" : ""}`}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
