# SilentKrowd — Lounge · Dining · Nightlife

A premium, cinematic React rebuild of the SilentKrowd lounge/dining/nightlife experience.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion for animation
- React Router v7
- Lenis for smooth scrolling
- Lucide React for icons
- React Helmet Async for SEO metadata

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

To create a production build:

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  assets/            static assets
  components/        one folder per section, plus ui/ for shared primitives
  layouts/           MainLayout wraps every route (nav, footer, cursor, cart)
  pages/             route-level components (Home, Menu, Reservations, Gallery, Contact, 404)
  hooks/             useLenis, useMousePosition, useLockBodyScroll
  context/           CartContext (global order state)
  data/              menu, spaces, cocktails, timeline, moments — all typed content
  styles/            global Tailwind entry + design tokens (@theme)
  utils/             cn() classname helper
```

## Design System

| Token | Value |
| --- | --- |
| Background | `#0A0A0A` |
| Secondary | `#141414` |
| Gold | `#C9A96E` |
| Text | `#F5F0EB` |
| Muted | `#8E8E8E` |
| Glass | `rgba(255,255,255,0.04)` |
| Border | `rgba(255,255,255,0.08)` |

Typography: **Playfair Display** (serif, display) + **Inter** (sans, body/UI).

Tokens live in `src/styles/index.css` under `@theme`, and are consumed as Tailwind utilities like `bg-SilentKrowd-black`, `text-SilentKrowd-gold`, `font-serif`.

## Notes

- Routes and heavy pages are code-split with `React.lazy`.
- The custom cursor and grain overlay automatically disable on touch devices / `prefers-reduced-motion`.
- Cart state is held in React context (`CartContext`) and persists across the Menu page and the slide-in cart drawer — refreshing the page clears it (no backend wired up).
- Images use `picsum.photos`/`unsplash.com` placeholders — swap in real photography before shipping.
