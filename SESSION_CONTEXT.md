---
description: "Pixel Den project state as of 2026-06-16: context for next session"
metadata:
  type: project
---

# Pixel Den — 精选小游戏

## Project State (2026-06-16)

### Completed
- **Project setup**: Next.js 16.2.9 (Turbopack) + React 19 + Tailwind CSS 4 + TypeScript
- **Three.js**: Installed (v0.184.0 + @types/three)
- **雷电** (`/games/raiden`): Full Canvas2D vertical shooter (~1045 lines) — playable, polished with menus, HUD, power-ups, touch controls
- **DNA 双螺旋** (`/games/dna-helix`): Three.js implementation — smooth CatmullRomCurve3 helix, TubeGeometry backbone, additive-blended glow sprites, proper raycasting, camera zoom on click
- **3D 魔方** (`/games/rubiks-cube`): Three.js implementation — proper 3x3x3 with colored faces, drag-to-orbit camera, click+slide-to-rotate-layer, scramble/solve buttons
- **Homepage** (`/`): Clean hero banner with Pixel Den branding + game grid
- **About page** (`/about`): Self-introduction page — philosophy, tech stack, current games, CTA
- **Logo** (`/components/Logo.tsx`): SVG brand logo (nested squares), 3 sizes (sm/md/lg)
- **Layout**: Header uses Logo component, nav links to all games + about page
- **DESIGN.md**: Complete design system specification

### Design System
- **Palette**: Void (#0a0a0f), Obsidian (#12121a), Graphite (#16161f), Ember (#ff5c2a), Ash (#eeeef0), Smoke (#8888a0), Dust (#55556a), Frost (#222233)
- **Fonts**: Geist Sans (display/body), Geist Mono (numbers/metadata)
- **Anti-patterns**: No neon glows, no emojis, no oversaturated gradients, no decorative orbs, no 3-column equal grids, no AI copywriting clichés
- **CSS**: Semantic classes in globals.css (.site-header, .hero-banner, .games-grid, .game-card, etc.)

### Key Files
- `/src/app/page.tsx` — Homepage
- `/src/app/about/page.tsx` — About/self-intro page
- `/src/app/layout.tsx` — Root layout with Logo, nav, footer
- `/src/app/globals.css` — Global styles (CSS design system)
- `/src/components/Logo.tsx` — Brand logo component
- `/src/components/GameCard.tsx` — Game card component
- `/src/app/games/raiden/page.tsx` — Shooter game
- `/src/app/games/dna-helix/page.tsx` — DNA helix
- `/src/app/games/rubiks-cube/page.tsx` — Rubik's cube
- `/DESIGN.md` — Design system specification

### VM & Deployment
- Runs in OrbStack VM at `atelier`
- Start: `~/Code/crack/claude/atelier/bin/devbox run bash -c "cd /mnt/mac/Users/lazy/Code/crack/claude/4399 && ./node_modules/.bin/next dev -p 3001"`
- SSH tunnel: `ssh -N -L 3001:localhost:3001 $(whoami)@atelier@orb`
- Target deployment: Vercel
