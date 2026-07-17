# Implementation Plan

## Overview

Incremental, build-verified tasks to implement the App Foundation. Each task is a concrete coding step that builds on the previous ones. Requirement references map back to `requirements.md`. The ordering respects the dependency graph below: tooling and env first, then the data layer, then auth, then routing/protection, then the shell and widgets, then the content client, and finally accessibility, tests, and build verification.

## Task Dependency Graph

Tasks are grouped into waves; tasks within a wave can proceed in parallel, and each wave depends on the previous ones.

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "rationale": "Install dependencies and tooling before any code." },
    { "wave": 2, "tasks": ["2"], "rationale": "The env module gates every server module." },
    { "wave": 3, "tasks": ["3", "9"], "rationale": "The Drizzle data layer and the Sanity client both depend only on env and are independent of each other." },
    { "wave": 4, "tasks": ["4"], "rationale": "Auth needs the Drizzle adapter and schema from task 3." },
    { "wave": 5, "tasks": ["5", "6"], "rationale": "Optimistic proxy and route-group restructure depend on auth being in place." },
    { "wave": 6, "tasks": ["7"], "rationale": "The app shell needs requireSession and the dashboard route group." },
    { "wave": 7, "tasks": ["8"], "rationale": "Dashboard widgets need the shell and the Sanity client." },
    { "wave": 8, "tasks": ["10", "11"], "rationale": "Accessibility pass and tests run once features exist." },
    { "wave": 9, "tasks": ["12"], "rationale": "Final build and deploy verification depends on everything." }
  ]
}
```

## Tasks

- [x] 1. Install dependencies and initialize tooling
  - Add runtime deps: `next-auth@beta`, `@auth/drizzle-adapter`, `drizzle-orm`, `@neondatabase/serverless`, `@sanity/client`, `zod`.
  - Add dev deps: `drizzle-kit`, `dotenv`.
  - Initialize shadcn/ui (`components.json`) targeting the existing tokens and `cn()`; add primitives used by the shell: `button`, `avatar`, `skeleton`, `sheet`, `tooltip`, `dropdown-menu`.
  - Verify the project still builds after install.
  - _Requirements: 5.1, 7.2, 11.1_

- [x] 2. Add fail-fast environment module and align env vars
  - Rename Sanity vars in `.env.local` to `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`; keep `SANITY_API_TOKEN` server-only.
  - Create `lib/env.ts` with Zod server + public schemas; parse at import, aggregate and throw named errors for missing/invalid vars.
  - Create a committed `.env.example` (no values) documenting the full required set; add a `!.env.example` exception to `.gitignore`.
  - _Requirements: 11.3, 11.4, 11.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 3. Implement the database client and schema
- [x] 3.1 Create Drizzle schema files
  - `lib/db/schema/auth.ts`: `users` (UUID PK, email unique, `lastLogin`, `createdAt`/`updatedAt`), `accounts`, `sessions`, `verification_tokens` shaped for `@auth/drizzle-adapter`.
  - `lib/db/schema/settings.ts`: `user_settings` (one-per-user, defaults for theme/dailyGoal/revision/notifications).
  - `lib/db/schema/future.ts`: stub tables `progress`, `notes`, `bookmarks`, `revision_queue`, `revision_history`, `analytics_daily` with `id`/`userId`/timestamps and `sanityDocumentId` where content is referenced.
  - `lib/db/schema/index.ts`: re-export all tables and inferred types.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
- [x] 3.2 Create the Drizzle client and migration config
  - `lib/db/client.ts`: `neon-http` driver over `env.DATABASE_URL` (pooled), Drizzle instance with schema.
  - `drizzle.config.ts`: use `DATABASE_URL_UNPOOLED`; add `db:generate` and `db:migrate` npm scripts (loading `.env.local` via dotenv).
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
- [x] 3.3 Generate and apply the initial migration to Neon
  - Run `db:generate` then `db:migrate`; confirm tables exist on the Neon branch.
  - _Requirements: 6.1, 6.2_

- [x] 4. Implement authentication
- [x] 4.1 Auth.js configuration and instance
  - `lib/auth/config.ts`: Google provider from env, `DrizzleAdapter`, `session` strategy `database` with `maxAge` 30 min and `updateAge` 5 min, `pages.signIn = "/login"`.
  - Add a `session` callback enforcing the 7-day absolute cap; `events.createUser` to insert the default `user_settings` row; `events.signIn` to set `lastLogin`.
  - `lib/auth/index.ts`: export `handlers`, `auth`, `signIn`, `signOut`.
  - _Requirements: 1.1, 1.3, 1.4, 1.7, 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
- [x] 4.2 Auth route handler and guards
  - `app/api/auth/[...nextauth]/route.ts`: export `{ GET, POST } = handlers`.
  - `lib/auth/guards.ts`: `getSession()` and `requireSession()` (redirect to `/login` when unauthenticated).
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 3.2_
- [x] 4.3 Sign-in / sign-out server actions and login page
  - `app/login/page.tsx`: public Server Component with a Google sign-in form (server action wrapping `signIn("google")`), rendering `?error=` states for failure/cancel/timeout.
  - Sign-out server action calling `signOut({ redirectTo: "/" })`.
  - _Requirements: 1.5, 1.6, 3.3, 3.4, 3.6_

- [ ] 5. Add optimistic route protection
  - Create root `proxy.ts` (Next.js 16): presence-check the session cookie for `/dashboard/:path*`, redirect to `/login?callbackUrl=…` when absent, with `config.matcher`.
  - _Requirements: 2.1, 2.6_

- [ ] 6. Restructure routes into route groups
  - Create `app/(marketing)/` and move the existing homepage into it (URL stays `/`); ensure marketing uses the plain root layout with no app shell.
  - Create the `app/(dashboard)/` group placeholder ahead of the shell.
  - Verify the homepage still renders at `/` and builds.
  - _Requirements: 10.1_

- [ ] 7. Build the authenticated app shell
- [ ] 7.1 Shell frame and navigation config
  - `components/dashboard/nav-items.ts`: shared nav definition.
  - `components/dashboard/app-shell.tsx` (Server): frame with sidebar/bottom-nav/user-menu slots and semantic landmarks.
  - `app/(dashboard)/layout.tsx` (Server): `await requireSession()`, render `<AppShell user={session.user}>`.
  - _Requirements: 2.2, 2.3, 9.1, 9.2, 10.1, 10.2, 12.3_
- [ ] 7.2 Responsive navigation components
  - `components/dashboard/sidebar.tsx` (Client): persistent ≥1024px, collapsible 768–1023px with toggle; active link via `usePathname`.
  - `components/dashboard/bottom-nav.tsx` (Client): fixed bottom bar <768px.
  - `components/dashboard/user-menu.tsx` (Client): avatar + sign-out action.
  - _Requirements: 9.2, 9.3, 9.4, 10.2, 10.3, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 8. Build the dashboard and widgets
- [ ] 8.1 Widget shell and states
  - `components/dashboard/widgets/widget-card.tsx`: shared header + skeleton (`WidgetSkeleton`) + error slot.
  - Add a `(dashboard)` `loading.tsx` and `error.tsx`, plus a per-widget error boundary with a 10s guard.
  - _Requirements: 9.6, 9.7_
- [ ] 8.2 The eight widgets and dashboard page
  - Implement Continue Learning, Daily Goal, Streak, Revision Queue, Recent Notes, Bookmarks, Activity Graph, Announcements as independent Server Components with documented empty/placeholder states (no hardcoded educational content).
  - `app/(dashboard)/dashboard/page.tsx`: compose all eight, each wrapped in `<Suspense>`.
  - _Requirements: 8.3, 8.4, 8.5, 9.1, 9.5, 9.6, 10.1_

- [ ] 9. Implement the Sanity content client
  - `lib/sanity/client.ts`: configured `@sanity/client` from `NEXT_PUBLIC_SANITY_*` + server token, `useCdn: true`.
  - `lib/sanity/queries.ts`: typed `sanityFetch<T>()` and a `healthCheck()` with a 5s bound returning reachable/unreachable.
  - `lib/sanity/types.ts`: initial content type placeholders.
  - Wire the Announcements widget to read from Sanity (empty state until content exists).
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.5_

- [ ] 10. Accessibility and reduced-motion pass
  - Ensure keyboard operability and visible focus (AA focus ring token) across shell and login; verify semantic landmarks and ARIA names on icon-only controls; honor `prefers-reduced-motion`; confirm AA contrast on new surfaces.
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 11. Tests
- [ ] 11.1 Unit tests
  - Set up Vitest. Cover `lib/env.ts` (missing/invalid), the 7-day/30-min session-cap logic, `requireSession()` behavior, `healthCheck()` success/timeout, and `user_settings` default creation.
  - _Requirements: 1.4, 3.1, 7.4, 7.5, 7.6, 11.5, 14.4_
- [ ] 11.2 Data-layer integration tests
  - Against a disposable Neon branch: user create-on-first-login, update-not-duplicate, single `user_settings` row, `createdAt` immutability and `updatedAt` advance.
  - _Requirements: 4.1, 4.3, 4.4, 6.4, 6.5_

- [ ] 12. Verify build and deploy configuration
  - Run `next build` + `tsc`; fix any type/lint issues; confirm `/` (marketing) is static and `/dashboard` redirects unauthenticated requests to `/login`.
  - Document the required Vercel env vars (mirror `.env.example`, with `AUTH_URL=https://trace-delta-three.vercel.app`).
  - _Requirements: 2.1, 10.1, 14.1, 14.2, 14.6_

## Notes

- The two hard boundaries hold throughout: user data only in Neon (Drizzle), educational content only in Sanity. Where user rows relate to content, they store the Sanity document id.
- Session policy is fixed: 30-minute inactivity timeout with a 7-day absolute cap.
- Widgets ship with empty/placeholder states in this spec; their real data sources arrive in later module specs (progress-type from Neon, Announcements from Sanity).
- After the data layer lands, rotate the Neon password and Sanity token (both were exposed in chat) and update `.env.local` + Vercel.
- E2E (Playwright) sign-in flow is scaffolded in the design but deferred; it needs test Google credentials.
