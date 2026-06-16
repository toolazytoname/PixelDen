# Pixel Den

A curated collection of handcrafted browser games — small, polished, no bloat.

![Preview](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Flazy%2Fpixel-den%2Fmain%2Fpackage.json&query=version&label=version&color=ff5c2a&style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-0.184-black?style=for-the-badge&logo=three.js)

---

## Games

| Game | Category | Tech |
|------|----------|------|
| **雷电** | Shooting | Canvas 2D — vertical scrolling shooter with power-ups, bosses, touch controls |
| **DNA 双螺旋** | Science | Three.js — interactive 3D DNA model with glow, raycasting, base-pair details |
| **3D 魔方** | Puzzle | Three.js — full 3×3 cube, drag to orbit, click-and-slide layer rotation, solve |

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **3D**: Three.js + @types/three
- **Fonts**: Geist Sans + Geist Mono
- **Deploy**: Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001)

## Development

This project uses an OrbStack VM for all development work. See [atelier/CLAUDE.md](../atelier/CLAUDE.md).

```bash
cd ../atelier
bin/devbox run pnpm dev   # runs inside the VM
```

## Project Structure

```
src/
├── app/
│   ├── games/
│   │   ├── raiden/          # 雷电 — Canvas 2D shooter
│   │   ├── dna-helix/       # DNA 双螺旋 — Three.js
│   │   └── rubiks-cube/     # 3D 魔方 — Three.js
│   ├── layout.tsx           # Shared header, nav, footer
│   ├── page.tsx             # Homepage with featured game + grid
│   └── globals.css          # Design tokens, component styles
└── components/
    └── GameCard.tsx         # Reusable game card
```

## Design System

Dark charcoal theme with a single orange accent (`#ff5c2a`). No neon glows, no emojis, no oversaturated gradients. See [src/app/globals.css](src/app/globals.css) for all tokens.

## License

MIT
