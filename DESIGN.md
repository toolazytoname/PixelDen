# Design System: Pixel Den

## 1. Visual Theme & Atmosphere

A curated digital workshop — part arcade cabinet, part maker's bench. The atmosphere is restrained and tactile: dark surfaces, measured contrast, one warm accent. Think of a well-lit desk at midnight with a single desk lamp illuminating whatever project you're tinkering with. Density is balanced (4/10), variance is moderate (5/10), motion is subtle (3/10). This is not a flashy storefront; it's a personal laboratory where ideas get built.

## 2. Color Palette & Roles

- **Void** (#0a0a0f) — Primary background, the deep darkness between projects
- **Obsidian** (#12121a) — Elevated surfaces, header, modals
- **Graphite** (#16161f) — Card fills, containers
- **Ember** (#ff5c2a) — Single accent. CTAs, active states, focus rings. Warm, energetic, intentional
- **Ash** (#eeeef0) — Primary text, Zinc-100 equivalent
- **Smoke** (#8888a0) — Secondary text, descriptions, metadata
- **Dust** (#55556a) — Tertiary text, disabled states
- **Frost** (#222233) — Borders, structural lines
- **Ice** (#333350) — Hover borders, elevated dividers

## 3. Typography Rules

- **Display:** Geist Sans — Track-tight (-0.02em), controlled scale, weight-driven hierarchy. Headlines communicate importance through boldness, not size inflation.
- **Body:** Geist Sans — Relaxed leading (1.5-1.7), max 65ch per line. Neutral secondary color for descriptions.
- **Mono:** Geist Mono — For code snippets, metadata, timestamps, stats. Numbers in games use mono.
- **Banned:** Inter, generic system fonts, serif fonts in UI.

## 4. Component Stylings

- **Buttons:** Flat, no outer glow. Tactile -1px translate on active. Accent fill for primary CTA, ghost/outline for secondary. Rounded 10px.
- **Cards:** Generously rounded corners (12px). Border-based elevation (1px frost). Hover lifts 2px, border brightens. Used sparingly — only when grouping related content.
- **Hero Banner:** Asymmetric layout, left-aligned content, subtle warm gradient wash. One badge, one title, one CTA. No overlapping decorative elements that scream "AI designed."
- **Grid:** CSS Grid, responsive columns. No equal-width forced layouts. Cards breathe with 16px gaps.
- **Badges:** Small, uppercase, muted background with accent-colored text. Category indicators only.
- **Nav Links:** Underline indicator on active, no dot indicators. Clean, minimal.

## 5. Layout Principles

- Max-width 1200px centered, generous horizontal padding (24px desktop, 16px mobile)
- Sticky header with backdrop blur
- Single-column mobile collapse below 768px
- Sections separated by vertical rhythm (48px desktop, 32px mobile)
- No overlapping elements — clean spatial separation
- Canvas games contained in fixed-aspect containers with border framing

## 6. Motion & Interaction

- Hover transitions: 150-200ms, ease-out cubic-bezier
- Transform-only animations (translateY, scale, opacity)
- No infinite pulse animations on CTAs (too gimmicky)
- Button active state: -1px translateY for tactile feedback
- Card hover: slight lift + border brighten

## 7. Anti-Patterns (Banned)

- No emojis in UI (game icons use abstract geometric symbols or typography)
- No neon/outer glow shadows on any element
- No oversaturated gradient text on headers
- No custom mouse cursors
- No "scroll to explore" filler text
- No 3-column equal card feature rows
- No fake statistics or round numbers
- No AI copywriting clichés ("Unleash", "Next-Gen", "Elevate")
- No pure black (#000000) backgrounds
- No centered hero sections with symmetrical decorative orbs
- No infinite pulsing animations on buttons
