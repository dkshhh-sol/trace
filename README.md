# Trace

The developer-first workspace for technical interview preparation — unifying
structured roadmaps, embedded lectures, coding problems, notes, spaced revision
and analytics into one place.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** lucide-react
- **Fonts:** Inter (UI) + Instrument Serif (display)
- **Deployment:** Vercel

Planned per the SRS: Auth.js (Google OAuth), Sanity CMS (content), Neon
PostgreSQL + Drizzle ORM (user data), shadcn/ui, TanStack Query, Zustand.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Create a production build         |
| `npm run start` | Run the production build locally  |
| `npm run lint`  | Lint the codebase                 |

## Project structure

```
app/                    App Router routes
  layout.tsx            Root layout (fonts, metadata)
  page.tsx              Marketing homepage
  globals.css           Design tokens (dark-first)
components/
  marketing/            Landing page sections
  ui/                   Reusable primitives
lib/                    Utilities
```

## Status

Homepage complete. Application modules (dashboard, roadmaps, lecture & problem
workspaces, notes, revision, analytics) are in progress.
