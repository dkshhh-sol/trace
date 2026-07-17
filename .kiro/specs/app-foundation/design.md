# Design Document

## Overview

The **App Foundation** establishes the authenticated backbone of Trace: Google sign-in, the user data layer, the content client, and the protected dashboard shell. Every future module (roadmaps, lectures, problems, notes, revision, analytics) plugs into the boundaries defined here.

Two architectural boundaries are non-negotiable and shape the entire design:

- **Educational content lives only in Sanity CMS**, accessed read-mostly through a typed content client.
- **User-specific data lives only in Neon PostgreSQL**, accessed exclusively through Drizzle ORM. Where a user row relates to educational content, it stores the **Sanity document id**, never a copy.

This design targets the already-scaffolded stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, deployed on Vercel. It reflects Next.js 16 conventions verified against the bundled docs — most importantly that **Middleware is now `proxy.ts`**, and that request-time authorization must be enforced in Server Components and Server Functions (the proxy layer is used only for cheap optimistic redirects).

## Requirements Coverage

| Requirement | Satisfied by |
| --- | --- |
| R1 Google OAuth | Auth.js v5 config, Google provider, `/api/auth/[...nextauth]` route handler, env module |
| R2 Protected Route Access Control | `proxy.ts` optimistic redirect + `requireSession()` server guard in `(dashboard)` layout and every Server Function |
| R3 Session Persistence & Logout | Database session strategy via Drizzle adapter, `signOut` action, session `maxAge`/`updateAge` |
| R4 User Record Lifecycle | Drizzle adapter `createUser`, `events.createUser` (settings + timestamps), `events.signIn` (lastLogin/updatedAt) |
| R5 Database Access via Drizzle | `lib/db/client.ts` Neon serverless + Drizzle, parameterized by construction |
| R6 Core Data Schema | `lib/db/schema/*` table definitions + future-table stubs |
| R7 Content Client | `lib/sanity/client.ts`, typed GROQ utilities, `healthCheck()` |
| R8 Content/Data Separation | Enforced by module boundaries; widget data-source rules; no hardcoded content |
| R9 Dashboard & App Shell | `(dashboard)` route group, `AppShell`, widget Server Components with Suspense |
| R10 Rendering Strategy | Server Components by default; Client Components only for sidebar toggle / interactive bits |
| R11 Input Validation & Secrets | Zod schemas at server-action boundaries; `lib/env.ts`; secrets server-only |
| R12 Accessibility | Semantic landmarks, focus-visible tokens, `prefers-reduced-motion`, AA contrast tokens |
| R13 Responsive Layout | Tailwind breakpoints md (768) / lg (1024) mapped to tablet/desktop; bottom nav < 768 |
| R14 Env Configuration & Deploy | `lib/env.ts` fail-fast validation; documented var set for `.env.local` + Vercel; pooled connection |

## Architecture

### High-level request flow

```
                         Browser
                            │
             ┌──────────────┴───────────────┐
             │        proxy.ts (edge)        │  optimistic: no session cookie on
             │  cheap redirect for /(dashboard)│  a protected path → redirect /login
             └──────────────┬───────────────┘
                            │
                 Next.js 16 App Router
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                     │
  Server Components   Server Functions    Route Handlers
  (RSC, default)      ("use server")      (/api/auth/[...nextauth])
        │                   │                     │
   requireSession()    auth() + Zod          Auth.js handlers
        │                   │                     │
        ├─────────── lib/auth (Auth.js v5) ───────┤
        │                   │
   ┌────┴─────┐        ┌────┴───────────┐
   │ Neon DB  │        │  Sanity CMS     │
   │ (Drizzle)│        │ (content client)│
   │ user data│        │ educational     │
   └──────────┘        └─────────────────┘
```

Two independent data planes never cross: Drizzle talks only to Neon (user data), the Sanity client talks only to Sanity (content). Merging happens in Server Components at render time.

### Authorization model (defense in depth)

Per the Next.js 16 proxy guidance, authorization is layered:

1. **Proxy (optimistic, edge):** `proxy.ts` checks only for the presence of the session cookie on `(dashboard)` paths and redirects to `/login` when absent. It performs no DB lookup. This is a fast UX guard, not the security boundary.
2. **Layout guard (authoritative):** the `(dashboard)/layout.tsx` Server Component calls `requireSession()`, which resolves the real session via `auth()`. Invalid/expired → `redirect('/login')`. No protected UI renders without a verified session.
3. **Server Function guard (authoritative):** every `"use server"` function re-verifies via `auth()` before touching data, because server functions are reachable by direct POST regardless of UI.

## Technology and Dependencies

Runtime dependencies to add:

- `next-auth@beta` (Auth.js v5) — authentication, session management, `auth()`/`signIn`/`signOut`.
- `@auth/drizzle-adapter` — persists users/accounts/sessions to Neon via Drizzle.
- `drizzle-orm` — schema + type-safe queries.
- `@neondatabase/serverless` — serverless Postgres driver for Neon.
- `@sanity/client` — Sanity content client.
- `zod` — env + input validation.

Dev dependencies:

- `drizzle-kit` — migration generation/apply.
- `dotenv` — load `.env.local` for the drizzle-kit CLI (Node context outside Next).

shadcn/ui: initialize now (`components.json`, `components/ui`). The SRS mandates it and the dashboard/app-shell benefits from its primitives (Button, Avatar, Skeleton, Sheet, Tooltip, DropdownMenu). It layers cleanly on our existing tokens and `cn()`.

## Folder and File Structure

```
app/
├─ (marketing)/               # existing homepage moves here (route group, no URL change)
│  └─ page.tsx
├─ (dashboard)/               # protected group
│  ├─ layout.tsx              # requireSession() + <AppShell>
│  └─ dashboard/
│     └─ page.tsx             # dashboard, composes widgets
├─ login/
│  └─ page.tsx                # public sign-in entry point
├─ api/
│  └─ auth/
│     └─ [...nextauth]/
│        └─ route.ts          # export { GET, POST } = handlers
├─ layout.tsx                 # existing root layout (fonts, metadata)
└─ globals.css                # existing tokens

lib/
├─ env.ts                     # Zod-validated env (server + public split)
├─ auth/
│  ├─ index.ts                # NextAuth() → { auth, handlers, signIn, signOut }
│  ├─ config.ts               # providers, adapter, session, callbacks, events
│  └─ guards.ts               # requireSession(), getSession()
├─ db/
│  ├─ client.ts               # drizzle(neon(DATABASE_URL))
│  ├─ schema/
│  │  ├─ auth.ts              # users, accounts, sessions, verificationTokens
│  │  ├─ settings.ts          # user_settings
│  │  ├─ future.ts            # progress, notes, bookmarks, revision_*, analytics_daily (stubs)
│  │  └─ index.ts             # re-export all
│  └─ queries/                # repository-style helpers (added per module)
├─ sanity/
│  ├─ client.ts               # configured @sanity/client
│  ├─ queries.ts              # typed GROQ utilities + healthCheck()
│  └─ types.ts                # content types
└─ utils.ts                   # existing cn()

components/
├─ ui/                        # shadcn primitives + existing logo.tsx
├─ marketing/                 # existing
└─ dashboard/
   ├─ app-shell.tsx           # layout frame (server) + slots
   ├─ sidebar.tsx             # desktop persistent / tablet collapsible (client for toggle)
   ├─ bottom-nav.tsx          # mobile (client for active state)
   ├─ nav-items.ts            # shared nav config
   ├─ user-menu.tsx           # avatar + sign-out (client)
   └─ widgets/
      ├─ widget-card.tsx      # shared shell w/ loading + error states
      ├─ continue-learning.tsx
      ├─ daily-goal.tsx
      ├─ streak.tsx
      ├─ revision-queue.tsx
      ├─ recent-notes.tsx
      ├─ bookmarks.tsx
      ├─ activity-graph.tsx
      └─ announcements.tsx

drizzle/                      # generated migrations
proxy.ts                      # root: optimistic auth redirect (was middleware.ts)
drizzle.config.ts             # uses DATABASE_URL_UNPOOLED
components.json               # shadcn config
```

> Moving the homepage into `(marketing)` is optional and URL-neutral; if it risks churn we keep `app/page.tsx` as-is. Documented as a low-priority task.

## Environment Configuration (`lib/env.ts`)

A single Zod-validated module is the only place `process.env` is read. It runs at import time so a missing/invalid variable fails fast with a named error (R11.5, R14.3–14.5).

```ts
import { z } from "zod";

const serverSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),          // pooled (runtime)
  DATABASE_URL_UNPOOLED: z.string().min(1), // direct (migrations)
  SANITY_API_TOKEN: z.string().min(1),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
});
```

**Public vs server split (design decision):** Sanity `projectId`, `dataset`, and `apiVersion` are not secrets and may be needed for client-side content fetches later, so they are exposed as `NEXT_PUBLIC_*`. The Sanity **token** and all auth/DB secrets remain server-only. This means `.env.local` variable names for Sanity change to `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` / `NEXT_PUBLIC_SANITY_API_VERSION` (a documented rename from the initial scaffold). On failure the module aggregates every missing/invalid key and throws before any request is served.

## Data Layer (`lib/db/client.ts`)

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

const sql = neon(env.DATABASE_URL);        // pooled endpoint, HTTP driver (serverless-friendly)
export const db = drizzle(sql, { schema });
```

- **Driver choice:** `neon-http` over the pooled connection string fits Vercel's serverless model (no long-lived sockets). It satisfies R5.3 (pooled) and works for the adapter's single-statement queries.
- **Parameterization (R5.2):** Drizzle's query builder binds all values as parameters; no string concatenation of user input is permitted anywhere.
- **Migrations:** `drizzle.config.ts` points `dbCredentials.url` at `DATABASE_URL_UNPOOLED`. Commands: `drizzle-kit generate` then `drizzle-kit migrate`, wired as `db:generate` / `db:migrate` npm scripts.
- **Error handling (R5.5–5.7):** query helpers surface a generic error to callers; connection strings/credentials are never included in messages or logs.
```

## Components and Interfaces

The foundation is organized into modules with narrow, typed interfaces so later specs consume them without reaching across boundaries.

| Module | File | Public interface | Consumers |
| --- | --- | --- | --- |
| Env | `lib/env.ts` | `env` (frozen, validated object) | all server modules |
| DB client | `lib/db/client.ts` | `db` (Drizzle instance) | auth adapter, query helpers |
| DB schema | `lib/db/schema/index.ts` | table objects + inferred `$inferSelect`/`$inferInsert` types | queries, adapter |
| Auth | `lib/auth/index.ts` | `handlers`, `auth`, `signIn`, `signOut` | route handler, actions |
| Auth guards | `lib/auth/guards.ts` | `getSession()`, `requireSession()` | dashboard layout, server functions |
| Content client | `lib/sanity/client.ts` | `sanityClient` | queries only |
| Content queries | `lib/sanity/queries.ts` | `sanityFetch<T>()`, `healthCheck()` | server components, widgets |
| App shell | `components/dashboard/app-shell.tsx` | `<AppShell user>` | dashboard layout |
| Widgets | `components/dashboard/widgets/*` | one Server Component export each | dashboard page |

Interface signatures (authoritative):

```ts
// auth guards
function getSession(): Promise<Session | null>;
function requireSession(): Promise<Session>;         // redirects to /login if absent

// content
function sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T>;
function healthCheck(): Promise<{ ok: true } | { ok: false; error: string }>;

// app shell
type AppShellProps = { user: { name?: string | null; email: string; image?: string | null }; children: React.ReactNode };
```

Server Functions (added with their modules) all follow the same contract: `auth()` check → Zod validation → Drizzle mutation → `revalidatePath`/`refresh`.

## Data Models

Schema lives in `lib/db/schema/*`. All tables use UUID primary keys and UTC `createdAt`/`updatedAt` (R6.3–6.5). Timestamps default to `now()` on insert; `updatedAt` is bumped on update via Drizzle `$onUpdate`.

### Auth tables (`schema/auth.ts`)

Shaped to satisfy `@auth/drizzle-adapter` while adding Trace-specific columns.

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);
```

- The `email` unique index (R Indexing / SRS 6.7) enforces one account per email; `provider + providerAccountId` is the stable identity match key for returning users (R4.4).
- `accounts` and `verificationTokens` use composite keys per the adapter contract; the UUID-PK convention (R6.3) applies to the user-owned entity tables. This adapter-shape exception is a documented decision.

### User settings (`schema/settings.ts`)

```ts
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("system"),          // system | light | dark
  dailyGoal: integer("daily_goal").notNull().default(3),
  revisionEnabled: boolean("revision_enabled").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

### Future-table stubs (`schema/future.ts`)

Defined now with minimal, consistent columns so later specs extend rather than rework (R6.2). Each carries `id` (UUID), `userId` FK, `createdAt`, `updatedAt`, and — where it references content — a `sanityDocumentId text` column instead of duplicated content (R6.6):

- `progress` — `userId`, `sanityDocumentId`, `status`, `completedAt`
- `notes` — `userId`, `sanityDocumentId`, `bodyMarkdown`
- `bookmarks` — `userId`, `sanityDocumentId`, `kind`
- `revisionQueue` — `userId`, `sanityDocumentId`, `dueAt`, `intervalIndex`
- `revisionHistory` — `userId`, `sanityDocumentId`, `reviewedAt`
- `analyticsDaily` — `userId`, `date`, `problemsSolved`, `minutesLearned`

**Invalid content reference (R6.7):** since Postgres cannot FK into Sanity, referential validity is enforced at the application layer — write helpers for content-referencing tables validate the Sanity id via the content client before insert and reject with an "invalid content reference" error. This rule is documented here and implemented when those tables are activated in later specs.

## Authentication (`lib/auth/*`)

### Config (`lib/auth/config.ts` → `lib/auth/index.ts`)

```ts
// lib/auth/index.ts
import NextAuth from "next-auth";
import { authConfig } from "./config";
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

```ts
// lib/auth/config.ts (shape)
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { userSettings } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const authConfig = {
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }),
  providers: [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })],
  session: { strategy: "database", maxAge: 30 * 60, updateAge: 5 * 60 }, // 30-min rolling inactivity
  pages: { signIn: "/login" },
  events: {
    createUser: async ({ user }) => {
      await db.insert(userSettings).values({ userId: user.id }); // defaults (R4.2)
    },
    signIn: async ({ user }) => {
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    },
  },
} satisfies NextAuthConfig;
```

### Session strategy and expiry (R1.4, R3.1)

- **Database sessions** via the adapter (session id in an httpOnly, Secure, SameSite=Lax cookie; state in the `sessions` table). This gives server-side invalidation on logout (R3.3).
- `maxAge = 30 min` with `updateAge = 5 min` implements the **30-minute inactivity** timeout: activity within the window refreshes `expires`; inactivity past 30 minutes expires the session.
- **Absolute lifetime cap** (R1: 24h / R3: 7d) is not native to Auth.js. **Decision (confirmed):** a **7-day absolute cap** combined with the **30-minute inactivity** rule. R1.4's 24h is superseded by R3.1's 7 days. The cap is enforced in the `session` callback by comparing `now` against the session's creation time and returning an expired result once 7 days elapse, independent of activity.
- CSRF/state validation (R1.7) is handled by Auth.js's built-in state/PKCE checks for the OAuth flow.

### Route handler

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

This backs `/api/auth/callback/google` (already registered in Google Console) and the sign-in/sign-out endpoints.

### Sign-in / sign-out flows

- **Sign in:** `/login` renders a Server Component with a form whose action calls a `"use server"` wrapper around `signIn("google")`. On success Auth.js redirects to the dashboard; on failure/cancel/timeout the user returns to `/login` with an error query param the page renders (R1.5–1.6).
- **Sign out:** `UserMenu` (client) posts to a `"use server"` action calling `signOut({ redirectTo: "/" })`. The adapter deletes the session row and the cookie is cleared (R3.3–3.4, R3.6 public route).

### Guards (`lib/auth/guards.ts`)

```ts
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() { return auth(); }

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}
```

`requireSession()` is the authoritative gate used by `(dashboard)/layout.tsx` and reused inside Server Functions (R2.3–2.5).

## Route Protection (`proxy.ts`)

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("authjs.session-token")
    || request.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

Optimistic only — presence check, no DB call, consistent with Next.js 16 proxy guidance. The real check remains `requireSession()` in the layout.

## Sanity Content Client (`lib/sanity/*`)

```ts
// lib/sanity/client.ts
import { createClient } from "@sanity/client";
import { env } from "@/lib/env";

export const sanityClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: env.SANITY_API_TOKEN,   // server-only; read access
  useCdn: true,                  // cache-friendly reads
});
```

```ts
// lib/sanity/queries.ts
import { sanityClient } from "./client";

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  return sanityClient.fetch<T>(query, params);
}

export type HealthResult = { ok: true } | { ok: false; error: string };

export async function healthCheck(): Promise<HealthResult> {
  try {
    await Promise.race([
      sanityClient.fetch('*[_type == "sanity.imageAsset"][0]._id'),
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 5000)),
    ]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Sanity is not reachable" };
  }
}
```

- `sanityFetch<T>` is the single typed entry point for content (R7.2); module-specific GROQ + result types are added alongside their schemas later.
- `healthCheck()` returns a reachable/unreachable result with a 5-second bound (R7.3–7.6).
- `useCdn: true` for read-mostly content; token stays server-side.

## Authenticated Dashboard and App Shell (`components/dashboard/*`)

### Layout composition

```
(dashboard)/layout.tsx  [Server]
  → await requireSession()               # authoritative guard (R2)
  → <AppShell user={session.user}>        # frame
       <Sidebar />        [Client: toggle state, active route]  desktop/tablet
       <BottomNav />      [Client: active route]                 mobile
       <UserMenu />       [Client: sign-out]
       <main>{children}</main>
    </AppShell>
```

`AppShell` is a Server Component; only the pieces needing interactivity (`Sidebar` collapse toggle, `BottomNav`/`Sidebar` active-link highlighting via `usePathname`, `UserMenu` dropdown + sign-out) are Client Components (R10). Navigation config lives in `nav-items.ts` and is shared by both `Sidebar` and `BottomNav` to avoid duplication.

### Responsive behavior (R9.2–9.4, R13)

Tailwind breakpoints map directly to the requirement bands:

- **Desktop `lg` (≥1024px):** persistent sidebar always visible; `BottomNav` hidden.
- **Tablet `md` (768–1023px):** sidebar collapsible via a toggle (shadcn `Sheet` or a width transition); starts collapsed.
- **Mobile (<768px):** sidebar hidden; `BottomNav` fixed to the bottom edge.

All layouts render content within the viewport width (no horizontal scroll) and keep every nav item reachable and keyboard-operable (R13.5–13.6).

### Widgets (R9.5–9.7)

Eight widgets — Continue Learning, Daily Goal, Streak, Revision Queue, Recent Notes, Bookmarks, Activity Graph, Announcements — render as independent Server Components, each wrapped in `<Suspense>` with a `WidgetCard` skeleton fallback so a slow/failed widget never blocks the shell or its siblings.

```
<WidgetCard title="…">          # shared shell: header, loading skeleton, error slot
  <Suspense fallback={<WidgetSkeleton/>}>
     {/* async server component fetching from its designated source */}
  </Suspense>
</WidgetCard>
```

- **Foundation-phase behavior:** data sources for these widgets arrive in later specs. Each widget renders a documented **empty/placeholder state** now (e.g. "Nothing yet — start a roadmap"). No hardcoded educational content is embedded (R8.3).
- **Data-source rules when activated:** progress-type widgets (Continue Learning, Daily Goal, Streak, Revision Queue, Recent Notes, Bookmarks, Activity Graph) read from **Neon**; **Announcements** reads from **Sanity** (R8.4–8.5).
- **Error/timeout (R9.7):** an error boundary + 10s guard per widget replaces the skeleton with an inline error state while the shell and other widgets keep rendering.

## Error Handling

| Layer | Strategy |
| --- | --- |
| Env validation | Aggregate all missing/invalid keys, throw named error at startup (R14.4) |
| DB queries | Repository helpers catch and rethrow generic errors; never leak connection string/credentials (R5.5–5.7) |
| Sanity | `healthCheck()` and `sanityFetch` return/raise reachable-vs-error; UI shows content error, never placeholder content (R8.6) |
| Auth | OAuth failure/cancel/timeout → `/login?error=…`; server-function unauthorized → thrown `Unauthorized` (R1.5–1.7, R2.5) |
| Widgets | Per-widget `error.tsx`/boundary + Suspense; isolated failures (R9.7) |
| Route segments | `(dashboard)/error.tsx` and `loading.tsx` for graceful fallback + skeletons |

## Testing Strategy

- **Unit:** `lib/env.ts` (missing/invalid vars), Zod input schemas, session-guard logic, `healthCheck()` success/timeout, user-settings default initialization. Vitest.
- **Integration:** Drizzle schema against a disposable Neon branch — user create-on-first-login, update-not-duplicate, settings row creation, timestamp behavior (R4, R6). Adapter round-trip for session create/delete.
- **E2E (later, Playwright):** full Google sign-in → dashboard → sign-out, and unauthenticated `/dashboard` → `/login` redirect. Requires test Google credentials; scaffolded, not run in this phase.
- **Accessibility:** automated axe checks on `/login` and `/dashboard`; manual keyboard-only pass of the app shell (R12).
- **Build gate:** `next build` + `tsc` must pass; a lint rule/check flags Client Components with no interactivity (R10.4).

## Correctness Properties

Invariants the implementation must preserve, expressed as properties that tests and reviews check:

### Property 1: Data-plane isolation
No module merges writes across `lib/db/*` and `lib/sanity/*`; user data never flows into Sanity and educational content is never persisted into Neon (only its document id is).
**Validates: Requirements 6.6, 8.1, 8.2**

### Property 2: No unauthenticated protected render
For every `(dashboard)` render path, a verified session exists before any protected markup is produced; `requireSession()` executes ahead of children.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Server-function authorization
Every `"use server"` function verifies `auth()` before any state change; an unauthenticated invocation mutates nothing.
**Validates: Requirements 2.4, 2.5**

### Property 4: Single user identity
Repeated sign-ins with the same provider identity key yield exactly one `users` row and exactly one `user_settings` row.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 5: Timestamp monotonicity
`createdAt` is immutable after insert; `updatedAt` is `>= createdAt` and advances on every update.
**Validates: Requirements 6.4, 6.5**

### Property 6: Secret confinement
No secret value (DB credentials, Sanity token, auth secret) appears in any client bundle, error message, log, or the git history.
**Validates: Requirements 11.3, 11.4, 11.6**

### Property 7: Fail-fast config
With any required env var missing/invalid, the app refuses to serve requests and names the offending variable(s).
**Validates: Requirements 14.3, 14.4, 14.5**

### Property 8: Widget isolation
A failing or slow widget never prevents the app shell or other widgets from rendering.
**Validates: Requirements 9.7**

## Design Decisions and Rationale

1. **Database sessions over JWT.** Enables true server-side logout/invalidation (R3.3) and a real `sessions` table per the SRS. Cost: a DB read per request, acceptable on Neon serverless and mitigated by the optimistic proxy check.
2. **Proxy for optimism, layout/action for authority.** Follows Next.js 16 guidance that proxy must not be the security boundary. Prevents the classic "middleware-only auth" bypass.
3. **`neon-http` driver + pooled URL.** Best fit for Vercel serverless; no socket lifecycle management. Migrations use the unpooled URL through drizzle-kit.
4. **Sanity config as `NEXT_PUBLIC_*`, token server-only.** projectId/dataset/apiVersion are non-secret and enable future client fetches; the token never leaves the server (R11.3). Requires renaming the three Sanity vars in `.env.local`.
5. **Adapter-shaped composite keys** on `accounts`/`verificationTokens` deviate from the UUID-PK convention because the Auth.js contract requires it; user-owned entity tables keep UUID PKs (R6.3).
6. **App-layer content-reference validation.** Postgres can't FK into Sanity, so validity of `sanityDocumentId` is checked via the content client at write time (R6.7).
7. **shadcn/ui initialized now.** SRS mandate; provides accessible primitives (focus management, ARIA) that advance R12 with less custom code.

## Resolved Decisions

1. **Absolute session cap:** confirmed **7-day absolute lifetime + 30-minute inactivity** timeout.
2. **Sanity var rename:** confirmed — the three non-secret Sanity values move to `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` / `NEXT_PUBLIC_SANITY_API_VERSION` in `.env.local` and Vercel; the token stays server-only as `SANITY_API_TOKEN`.
3. **Homepage relocation:** confirmed — move the existing homepage into an `app/(marketing)/` route group (URL stays `/`), so marketing and dashboard each own a dedicated layout. Marketing keeps the plain root layout with no app shell; the `(dashboard)` group adds the authenticated shell.
