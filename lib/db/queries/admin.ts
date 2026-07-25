import "server-only";

import { and, count, desc, eq, gte, like, or, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  progress,
  githubConnections,
  userAchievements,
  supportTickets,
  featureRequests,
  announcements,
  siteSettings,
} from "@/lib/db/schema";
import {
  currentStreakFromSolves,
  topicSolveDistribution,
  TOTAL_PROBLEMS,
  type Solve,
} from "@/lib/progress/compute";
import { striverA2Z } from "@/lib/content/striver";

const SLUG_PREFIX = `${striverA2Z.slug}:`;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function startOfTodayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function scalar(promise: Promise<{ n: number }[]>): Promise<number> {
  const [row] = await promise;
  return Number(row?.n ?? 0);
}

/* --------------------------------- Overview -------------------------------- */

export async function getOverview() {
  const today = startOfTodayUTC();
  const [
    totalUsers,
    activeToday,
    activeWeek,
    mau,
    solvedToday,
    solvedTotal,
    topicsCompleted,
    achievementsUnlocked,
    goalsCompleted,
    githubConns,
    tickets,
    features,
  ] = await Promise.all([
    scalar(db.select({ n: count() }).from(users)),
    scalar(db.select({ n: count() }).from(users).where(gte(users.lastLogin, today))),
    scalar(db.select({ n: count() }).from(users).where(gte(users.lastLogin, daysAgo(7)))),
    scalar(db.select({ n: count() }).from(users).where(gte(users.lastLogin, daysAgo(30)))),
    scalar(
      db
        .select({ n: count() })
        .from(progress)
        .where(and(eq(progress.status, "completed"), gte(progress.completedAt, today))),
    ),
    scalar(db.select({ n: count() }).from(progress).where(eq(progress.status, "completed"))),
    scalar(
      db
        .select({ n: count() })
        .from(userAchievements)
        .where(like(userAchievements.achievementId, "topic_%")),
    ),
    scalar(db.select({ n: count() }).from(userAchievements)),
    scalar(
      db
        .select({ n: count() })
        .from(userAchievements)
        .where(like(userAchievements.achievementId, "goal_%")),
    ),
    scalar(db.select({ n: count() }).from(githubConnections)),
    scalar(db.select({ n: count() }).from(supportTickets)),
    scalar(db.select({ n: count() }).from(featureRequests)),
  ]);

  return {
    totalUsers,
    activeToday,
    activeWeek,
    mau,
    solvedToday,
    solvedTotal,
    topicsCompleted,
    achievementsUnlocked,
    goalsCompleted,
    githubConns,
    tickets,
    features,
  };
}

/* ------------------------------- Analytics --------------------------------- */

export async function getAnalytics() {
  const day = sql<string>`to_char(date_trunc('day', ${users.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const solveDay = sql<string>`to_char(date_trunc('day', ${progress.completedAt} at time zone 'UTC'), 'YYYY-MM-DD')`;

  const [
    registrations,
    activity,
    returning,
    usersWithSolves,
    solvedTotal,
    solved30,
    topicRows,
  ] = await Promise.all([
    db
      .select({ day, n: count() })
      .from(users)
      .where(gte(users.createdAt, daysAgo(14)))
      .groupBy(day)
      .orderBy(day),
    db
      .select({ day: solveDay, n: count() })
      .from(progress)
      .where(and(eq(progress.status, "completed"), gte(progress.completedAt, daysAgo(30))))
      .groupBy(solveDay)
      .orderBy(solveDay),
    scalar(
      db
        .select({ n: count() })
        .from(users)
        .where(sql`${users.lastLogin} is not null and ${users.lastLogin}::date > ${users.createdAt}::date`),
    ),
    scalar(
      db
        .select({ n: sql<number>`count(distinct ${progress.userId})` })
        .from(progress)
        .where(eq(progress.status, "completed")),
    ),
    scalar(db.select({ n: count() }).from(progress).where(eq(progress.status, "completed"))),
    scalar(
      db
        .select({ n: count() })
        .from(progress)
        .where(and(eq(progress.status, "completed"), gte(progress.completedAt, daysAgo(30)))),
    ),
    db
      .select({ sid: progress.sanityDocumentId })
      .from(progress)
      .where(and(eq(progress.status, "completed"), like(progress.sanityDocumentId, `${SLUG_PREFIX}%`))),
  ]);

  const prefixLen = SLUG_PREFIX.length;
  const dist = topicSolveDistribution(
    topicRows.map((r) => r.sid.slice(prefixLen)),
  ).filter((t) => t.total > 0);
  const mostSolved = [...dist].sort((a, b) => b.solved - a.solved).slice(0, 6);
  const leastSolved = [...dist].sort((a, b) => a.solved - b.solved).slice(0, 6);

  const avgSolvedPerUser = usersWithSolves > 0 ? solvedTotal / usersWithSolves : 0;
  const avgProgressPct = Math.round((avgSolvedPerUser / TOTAL_PROBLEMS) * 100);
  const avgProblemsPerDay = Math.round((solved30 / 30) * 10) / 10;

  return {
    registrations: registrations.map((r) => ({ day: r.day, n: Number(r.n) })),
    activity: activity.map((r) => ({ day: r.day, n: Number(r.n) })),
    returningUsers: returning,
    avgProgressPct,
    avgProblemsPerDay,
    mostSolved,
    leastSolved,
  };
}

/* ---------------------------- User management ------------------------------ */

const PAGE_SIZE = 20;

export async function listUsers(query: string, page: number) {
  const q = query.trim();
  const where = q
    ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined;

  const [rows, total] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
    scalar(db.select({ n: count() }).from(users).where(where)),
  ]);

  const ids = rows.map((r) => r.id);
  const solvesByUser = new Map<string, Solve[]>();
  const topicsByUser = new Map<string, number>();
  const ghSet = new Set<string>();

  if (ids.length > 0) {
    const [solveRows, topicRows, ghRows] = await Promise.all([
      db
        .select({
          userId: progress.userId,
          problemId: progress.sanityDocumentId,
          completedAt: progress.completedAt,
        })
        .from(progress)
        .where(and(eq(progress.status, "completed"), inArray(progress.userId, ids))),
      db
        .select({ userId: userAchievements.userId, n: count() })
        .from(userAchievements)
        .where(and(like(userAchievements.achievementId, "topic_%"), inArray(userAchievements.userId, ids)))
        .groupBy(userAchievements.userId),
      db
        .select({ userId: githubConnections.userId })
        .from(githubConnections)
        .where(inArray(githubConnections.userId, ids)),
    ]);

    for (const r of solveRows) {
      const list = solvesByUser.get(r.userId) ?? [];
      list.push({ problemId: r.problemId, completedAt: r.completedAt });
      solvesByUser.set(r.userId, list);
    }
    for (const r of topicRows) topicsByUser.set(r.userId, Number(r.n));
    for (const r of ghRows) ghSet.add(r.userId);
  }

  const items = rows.map((u) => {
    const solves = solvesByUser.get(u.id) ?? [];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      joinedAt: u.createdAt.toISOString(),
      lastActive: u.lastLogin ? u.lastLogin.toISOString() : null,
      problemsSolved: solves.length,
      topicsCompleted: topicsByUser.get(u.id) ?? 0,
      currentStreak: currentStreakFromSolves(solves),
      githubConnected: ghSet.has(u.id),
    };
  });

  return { items, total, page, pageSize: PAGE_SIZE };
}

/* -------------------------------- Tickets ---------------------------------- */

export async function listTickets(status?: string) {
  const where = status ? eq(supportTickets.status, status) : undefined;
  const rows = await db
    .select({
      id: supportTickets.id,
      category: supportTickets.category,
      title: supportTickets.title,
      description: supportTickets.description,
      stepsToReproduce: supportTickets.stepsToReproduce,
      screenshot: supportTickets.screenshot,
      browser: supportTickets.browser,
      operatingSystem: supportTickets.operatingSystem,
      viewport: supportTickets.viewport,
      route: supportTickets.route,
      version: supportTickets.version,
      githubConnected: supportTickets.githubConnected,
      currentStreak: supportTickets.currentStreak,
      problemsSolved: supportTickets.problemsSolved,
      status: supportTickets.status,
      priority: supportTickets.priority,
      createdAt: supportTickets.createdAt,
      reporterName: users.name,
      reporterEmail: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(users.id, supportTickets.userId))
    .where(where)
    .orderBy(desc(supportTickets.createdAt))
    .limit(200);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/* ---------------------------- Feature requests ----------------------------- */

export async function listFeatureRequests(status?: string, query?: string) {
  const conds = [];
  if (status) conds.push(eq(featureRequests.status, status));
  if (query?.trim())
    conds.push(
      or(
        ilike(featureRequests.title, `%${query.trim()}%`),
        ilike(featureRequests.description, `%${query.trim()}%`),
      ),
    );
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: featureRequests.id,
      title: featureRequests.title,
      description: featureRequests.description,
      whyUseful: featureRequests.whyUseful,
      status: featureRequests.status,
      votes: featureRequests.votes,
      internalNotes: featureRequests.internalNotes,
      createdAt: featureRequests.createdAt,
      reporterName: users.name,
      reporterEmail: users.email,
    })
    .from(featureRequests)
    .leftJoin(users, eq(users.id, featureRequests.userId))
    .where(where)
    .orderBy(desc(featureRequests.votes), desc(featureRequests.createdAt))
    .limit(200);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/* ------------------------------ Announcements ------------------------------ */

export async function listAnnouncements() {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(200);
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/* ------------------------------- Settings ---------------------------------- */

export async function getSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "global"))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(siteSettings)
    .values({ id: "global" })
    .onConflictDoNothing()
    .returning();
  return (
    created ?? {
      id: "global",
      maintenanceMode: false,
      registrationsEnabled: true,
      defaultDailyGoal: 2,
      currentVersion: "1.0.0",
      updatedAt: new Date(),
    }
  );
}

/* -------------------------------- Content ---------------------------------- */

import { sanityClient } from "@/lib/sanity/client";
import { env } from "@/lib/env";

export async function getContentStats() {
  const studioUrl = `https://${env.NEXT_PUBLIC_SANITY_PROJECT_ID}.sanity.studio`;
  try {
    const [published, drafts, recent] = await Promise.all([
      sanityClient.fetch<number>(`count(*[!(_id in path("drafts.**"))])`),
      sanityClient.fetch<number>(`count(*[_id in path("drafts.**")])`),
      sanityClient.fetch<{ _id: string; _type: string; title: string; _updatedAt: string }[]>(
        `*[!(_id in path("drafts.**"))] | order(_updatedAt desc)[0...5]{ _id, _type, "title": coalesce(title, name, _id), _updatedAt }`,
      ),
    ]);
    return {
      reachable: true as const,
      published: Number(published ?? 0),
      drafts: Number(drafts ?? 0),
      recent: recent ?? [],
      studioUrl,
    };
  } catch {
    return {
      reachable: false as const,
      published: 0,
      drafts: 0,
      recent: [] as { _id: string; _type: string; title: string; _updatedAt: string }[],
      studioUrl,
    };
  }
}
