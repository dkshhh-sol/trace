"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  BarChart3,
  Users,
  Ticket,
  Lightbulb,
  Megaphone,
  FileText,
  Settings2,
  ShieldCheck,
  ExternalLink,
  Search,
  Trash2,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  adminOverview,
  adminAnalytics,
  adminUsers,
  adminTickets,
  adminUpdateTicket,
  adminDeleteTicket,
  adminFeatureRequests,
  adminUpdateFeatureRequest,
  adminAnnouncements,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
  adminSettings,
  adminUpdateSettings,
  adminContent,
} from "@/lib/admin/actions";

type TabKey =
  | "overview"
  | "analytics"
  | "users"
  | "tickets"
  | "features"
  | "announcements"
  | "content"
  | "settings";

const TABS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", Icon: LayoutGrid },
  { key: "analytics", label: "Analytics", Icon: BarChart3 },
  { key: "users", label: "Users", Icon: Users },
  { key: "tickets", label: "Tickets", Icon: Ticket },
  { key: "features", label: "Feature Requests", Icon: Lightbulb },
  { key: "announcements", label: "Announcements", Icon: Megaphone },
  { key: "content", label: "Content", Icon: FileText },
  { key: "settings", label: "Settings", Icon: Settings2 },
];

export function Console({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand" />
          <span className="text-sm font-medium text-foreground">Trace Console</span>
        </div>
        <span className="truncate text-xs text-muted-foreground">{adminEmail}</span>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                tab === t.key
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <t.Icon className="size-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          {tab === "overview" && <OverviewSection />}
          {tab === "analytics" && <AnalyticsSection />}
          {tab === "users" && <UsersSection />}
          {tab === "tickets" && <TicketsSection />}
          {tab === "features" && <FeaturesSection />}
          {tab === "announcements" && <AnnouncementsSection />}
          {tab === "content" && <ContentSection />}
          {tab === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

/* --------------------------------- Helpers --------------------------------- */

function useAsync<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fn()
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // Runs once on mount; `fn` is a fresh closure each render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading, error, setData };
}

function SectionState({ loading }: { loading: boolean }) {
  if (loading)
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  return (
    <p className="py-20 text-center text-sm text-muted-foreground">
      Couldn&rsquo;t load this section.
    </p>
  );
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number | string;
  Icon: LucideIcon;
}) {
  return (
    <div className="surface rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-brand" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 text-2xl tracking-tight tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function BarChart({
  data,
  label,
}: {
  data: { day: string; n: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="surface rounded-xl p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
      {data.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No data yet.
        </p>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {data.map((d) => (
            <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-brand/40 to-brand transition-all"
                  style={{ height: `${Math.max(4, (d.n / max) * 100)}%` }}
                  title={`${d.day}: ${d.n}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/* -------------------------------- Overview --------------------------------- */

function OverviewSection() {
  const { data, loading } = useAsync(() => adminOverview());
  if (!data) return <SectionState loading={loading} />;

  const cards: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Total Users", value: data.totalUsers, Icon: Users },
    { label: "Active Today", value: data.activeToday, Icon: BarChart3 },
    { label: "Active This Week", value: data.activeWeek, Icon: BarChart3 },
    { label: "Monthly Active", value: data.mau, Icon: BarChart3 },
    { label: "Solved Today", value: data.solvedToday, Icon: LayoutGrid },
    { label: "Problems Solved", value: data.solvedTotal, Icon: LayoutGrid },
    { label: "Topics Completed", value: data.topicsCompleted, Icon: FileText },
    { label: "Achievements", value: data.achievementsUnlocked, Icon: ShieldCheck },
    { label: "Goals Completed", value: data.goalsCompleted, Icon: LayoutGrid },
    { label: "GitHub Connections", value: data.githubConns, Icon: ExternalLink },
    { label: "Support Tickets", value: data.tickets, Icon: Ticket },
    { label: "Feature Requests", value: data.features, Icon: Lightbulb },
  ];

  return (
    <Panel title="Overview">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </Panel>
  );
}

/* -------------------------------- Analytics -------------------------------- */

function AnalyticsSection() {
  const { data, loading } = useAsync(() => adminAnalytics());
  if (!data) return <SectionState loading={loading} />;

  return (
    <div className="space-y-6">
      <Panel title="User analytics">
        <div className="grid gap-3 sm:grid-cols-2">
          <BarChart data={data.registrations} label="New registrations (14 days)" />
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Returning Users" value={data.returningUsers} Icon={Users} />
            <StatCard label="Avg Progress" value={`${data.avgProgressPct}%`} Icon={BarChart3} />
            <StatCard label="Avg Problems/Day" value={data.avgProblemsPerDay} Icon={LayoutGrid} />
          </div>
        </div>
      </Panel>

      <Panel title="Learning analytics">
        <div className="space-y-3">
          <BarChart data={data.activity} label="Platform activity — problems solved (30 days)" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TopicList title="Most solved topics" items={data.mostSolved} />
            <TopicList title="Least solved topics" items={data.leastSolved} />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TopicList({
  title,
  items,
}: {
  title: string;
  items: { topic: string; solved: number; total: number }[];
}) {
  return (
    <div className="surface rounded-xl p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t.topic} className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-foreground">{t.topic}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {t.solved} / {t.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- Shared ---------------------------------- */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-in fade-in-0 absolute inset-0 bg-black/50 backdrop-blur-sm duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-in fade-in-0 zoom-in-95 surface relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-2xl duration-150"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

const selectCls =
  "h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ---------------------------------- Users ---------------------------------- */

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  joinedAt: string;
  lastActive: string | null;
  problemsSolved: number;
  topicsCompleted: number;
  currentStreak: number;
  githubConnected: boolean;
};

function UsersSection() {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{
    items: AdminUser[];
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  useEffect(() => {
    let active = true;
    adminUsers(term, page)
      .then((d) => active && setData(d))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [term, page]);

  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <Panel title="User management">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setTerm(query);
        }}
        className="mb-3 flex items-center gap-2"
      >
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-2.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </form>

      <div className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Solved</th>
                <th className="px-3 py-2 font-medium">Topics</th>
                <th className="px-3 py-2 font-medium">Streak</th>
                <th className="px-3 py-2 font-medium">GitHub</th>
                <th className="px-3 py-2 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : (
                data?.items.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/40"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-[9px] text-foreground">
                          {u.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
                          ) : (
                            (u.name || u.email)[0]?.toUpperCase()
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-foreground">{u.name ?? "—"}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(u.joinedAt)}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">{u.problemsSolved}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">{u.topicsCompleted}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">{u.currentStreak}</td>
                    <td className="px-3 py-2 text-muted-foreground">{u.githubConnected ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(u.lastActive)}</td>
                  </tr>
                ))
              )}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <ModalShell title={selected.name ?? selected.email} onClose={() => setSelected(null)}>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Email" value={selected.email} />
            <Detail label="Joined" value={fmtDate(selected.joinedAt)} />
            <Detail label="Problems solved" value={String(selected.problemsSolved)} />
            <Detail label="Topics completed" value={String(selected.topicsCompleted)} />
            <Detail label="Current streak" value={`${selected.currentStreak} days`} />
            <Detail label="GitHub" value={selected.githubConnected ? "Connected" : "Not connected"} />
            <Detail label="Last active" value={fmtDate(selected.lastActive)} />
          </dl>
        </ModalShell>
      )}
    </Panel>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-foreground">{value}</dd>
    </div>
  );
}

/* --------------------------------- Tickets --------------------------------- */

const TICKET_STATUS_OPTS = ["open", "investigating", "in_progress", "resolved", "closed"];
const TICKET_PRIORITY_OPTS = ["none", "low", "medium", "high", "urgent"];

type AdminTicket = {
  id: string;
  category: string;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  screenshot: string | null;
  browser: string | null;
  operatingSystem: string | null;
  viewport: string | null;
  route: string | null;
  version: string | null;
  githubConnected: boolean;
  currentStreak: number;
  problemsSolved: number;
  status: string;
  priority: string;
  createdAt: string;
  reporterName: string | null;
  reporterEmail: string | null;
};

function label(s: string) {
  return s.replace(/_/g, " ");
}

function TicketsSection() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<AdminTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminTicket | null>(null);

  useEffect(() => {
    let active = true;
    adminTickets(status || undefined)
      .then((d) => active && setRows(d as AdminTicket[]))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status]);

  async function update(id: string, patch: { status?: string; priority?: string }) {
    try {
      await adminUpdateTicket({
        id,
        status: patch.status as never,
        priority: patch.priority as never,
      });
      toast("Ticket updated.", "success");
      setRows((prev) =>
        prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? prev,
      );
      setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
    } catch {
      toast("Couldn't update ticket.", "error");
    }
  }

  async function remove(id: string) {
    try {
      await adminDeleteTicket(id);
      toast("Ticket deleted.", "success");
      setRows((prev) => prev?.filter((t) => t.id !== id) ?? prev);
      setSelected(null);
    } catch {
      toast("Couldn't delete ticket.", "error");
    }
  }

  return (
    <Panel title="Ticket management">
      <div className="mb-3 flex items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {TICKET_STATUS_OPTS.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Reporter</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : (
                rows?.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/40"
                  >
                    <td className="px-3 py-2"><Badge>{label(t.priority)}</Badge></td>
                    <td className="px-3 py-2"><Badge>{label(t.category)}</Badge></td>
                    <td className="max-w-[220px] px-3 py-2"><span className="truncate text-foreground">{t.title}</span></td>
                    <td className="px-3 py-2 text-muted-foreground">{t.reporterName ?? t.reporterEmail ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(t.createdAt)}</td>
                    <td className="px-3 py-2"><Badge>{label(t.status)}</Badge></td>
                  </tr>
                ))
              )}
              {!loading && rows?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ModalShell title={selected.title} onClose={() => setSelected(null)}>
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{label(selected.category)}</Badge>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Status
                <select
                  value={selected.status}
                  onChange={(e) => update(selected.id, { status: e.target.value })}
                  className={selectCls}
                >
                  {TICKET_STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>{label(s)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Priority
                <select
                  value={selected.priority}
                  onChange={(e) => update(selected.id, { priority: e.target.value })}
                  className={selectCls}
                >
                  {TICKET_PRIORITY_OPTS.map((s) => (
                    <option key={s} value={s}>{label(s)}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="whitespace-pre-wrap text-foreground">{selected.description}</p>
            {selected.stepsToReproduce && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Steps to reproduce</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{selected.stepsToReproduce}</p>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3">
              <Detail label="Reporter" value={selected.reporterName ?? selected.reporterEmail ?? "—"} />
              <Detail label="Route" value={selected.route ?? "—"} />
              <Detail label="Browser" value={selected.browser ?? "—"} />
              <Detail label="OS" value={selected.operatingSystem ?? "—"} />
              <Detail label="Viewport" value={selected.viewport ?? "—"} />
              <Detail label="Version" value={selected.version ?? "—"} />
              <Detail label="Streak" value={`${selected.currentStreak} days`} />
              <Detail label="Solved" value={String(selected.problemsSolved)} />
            </dl>

            {selected.screenshot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.screenshot} alt="Screenshot" className="w-full rounded-lg border border-border" />
            )}

            <div className="flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={() => remove(selected.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" /> Delete ticket
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </Panel>
  );
}

/* ----------------------------- Feature requests ---------------------------- */

const FEATURE_STATUS_OPTS = ["under_review", "planned", "in_progress", "released", "declined"];

type AdminFeature = {
  id: string;
  title: string;
  description: string;
  whyUseful: string | null;
  status: string;
  votes: number;
  internalNotes: string | null;
  createdAt: string;
  reporterName: string | null;
  reporterEmail: string | null;
};

function FeaturesSection() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<AdminFeature[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminFeatureRequests(status || undefined, term || undefined)
      .then((d) => active && setRows(d as AdminFeature[]))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, term]);

  async function save(id: string, patch: { status?: string; internalNotes?: string }) {
    try {
      await adminUpdateFeatureRequest({
        id,
        status: patch.status as never,
        internalNotes: patch.internalNotes,
      });
      toast("Feature request updated.", "success");
      setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? prev);
    } catch {
      toast("Couldn't update request.", "error");
    }
  }

  return (
    <Panel title="Feature requests">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query);
        }}
        className="mb-3 flex items-center gap-2"
      >
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {FEATURE_STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-2.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests"
            className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </form>

      {loading ? (
        <SectionState loading />
      ) : (
        <div className="space-y-3">
          {rows?.map((r) => (
            <div key={r.id} className="surface rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.reporterName ?? r.reporterEmail ?? "—"} · {fmtDate(r.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {r.votes} votes
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              {r.whyUseful && (
                <p className="mt-1 text-xs text-muted-foreground">Why: {r.whyUseful}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Status
                  <select
                    value={r.status}
                    onChange={(e) => save(r.id, { status: e.target.value })}
                    className={selectCls}
                  >
                    {FEATURE_STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>{label(s)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <InternalNotes
                initial={r.internalNotes ?? ""}
                onSave={(notes) => save(r.id, { internalNotes: notes })}
              />
            </div>
          ))}
          {rows?.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No feature requests.</p>
          )}
        </div>
      )}
    </Panel>
  );
}

function InternalNotes({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(initial);
  const dirty = notes !== initial;
  return (
    <div className="mt-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Internal notes (not shown to the user)"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {dirty && (
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => onSave(notes)}
            className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background"
          >
            Save notes
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Announcements ------------------------------ */

const ANNOUNCEMENT_TYPE_OPTS = ["information", "maintenance", "update"];

type AdminAnnouncement = {
  id: string;
  title: string;
  description: string;
  type: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

function AnnouncementsSection() {
  const { data, loading, setData } = useAsync(() => adminAnnouncements());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("information");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (title.trim().length < 2 || description.trim().length < 2) {
      toast("Add a title and description.", "error");
      return;
    }
    setCreating(true);
    try {
      await adminCreateAnnouncement({
        title,
        description,
        type: type as never,
        published: false,
      });
      toast("Announcement created.", "success");
      setTitle("");
      setDescription("");
      const fresh = await adminAnnouncements();
      setData(fresh);
    } catch {
      toast("Couldn't create announcement.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function togglePublish(a: AdminAnnouncement) {
    try {
      await adminUpdateAnnouncement({ id: a.id, published: !a.published });
      toast(a.published ? "Unpublished." : "Announcement published.", "success");
      setData((prev) =>
        (prev as AdminAnnouncement[] | null)?.map((x) =>
          x.id === a.id ? { ...x, published: !x.published } : x,
        ) ?? prev,
      );
    } catch {
      toast("Couldn't update announcement.", "error");
    }
  }

  async function remove(id: string) {
    try {
      await adminDeleteAnnouncement(id);
      toast("Announcement deleted.", "success");
      setData((prev) => (prev as AdminAnnouncement[] | null)?.filter((x) => x.id !== id) ?? prev);
    } catch {
      toast("Couldn't delete announcement.", "error");
    }
  }

  const list = data as AdminAnnouncement[] | null;

  return (
    <Panel title="Announcements">
      <div className="surface mb-4 space-y-3 rounded-xl p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description"
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            {ANNOUNCEMENT_TYPE_OPTS.map((t) => (
              <option key={t} value={t}>{label(t)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {!list ? (
        <SectionState loading={loading} />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="surface rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <Badge>{label(a.type)}</Badge>
                    {a.published && (
                      <span className="text-[10px] font-medium text-brand">Published</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => togglePublish(a)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:border-foreground/40"
                >
                  {a.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No announcements.</p>
          )}
        </div>
      )}
    </Panel>
  );
}

/* --------------------------------- Content --------------------------------- */

function ContentSection() {
  const { data, loading } = useAsync(() => adminContent());
  if (!data) return <SectionState loading={loading} />;

  return (
    <Panel title="Content">
      {!data.reachable && (
        <p className="mb-3 text-xs text-muted-foreground">
          Sanity is not reachable right now. Counts may be unavailable.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Published" value={data.published} Icon={FileText} />
        <StatCard label="Drafts" value={data.drafts} Icon={FileText} />
        <StatCard label="Recent" value={data.recent.length} Icon={FileText} />
      </div>

      <div className="surface mt-4 rounded-xl p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Recent documents</p>
        <ul className="space-y-2">
          {data.recent.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{d.title}</span>
              <Badge>{d._type}</Badge>
            </li>
          ))}
          {data.recent.length === 0 && (
            <li className="text-xs text-muted-foreground">No documents yet.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <a
          href={data.studioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
        >
          Open Sanity Studio
          <ExternalLink className="size-4" />
        </a>
      </div>
    </Panel>
  );
}

/* --------------------------------- Settings -------------------------------- */

type AdminSettings = {
  maintenanceMode: boolean;
  registrationsEnabled: boolean;
  defaultDailyGoal: number;
  currentVersion: string;
};

function SettingsSection() {
  const { data, loading } = useAsync(() => adminSettings());
  const [form, setForm] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    // Seed the editable form once the fetched settings arrive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      maintenanceMode: data.maintenanceMode,
      registrationsEnabled: data.registrationsEnabled,
      defaultDailyGoal: data.defaultDailyGoal,
      currentVersion: data.currentVersion,
    });
  }, [data]);

  if (!form) return <SectionState loading={loading} />;

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      await adminUpdateSettings(form);
      toast("Settings saved.", "success");
    } catch {
      toast("Couldn't save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Site settings">
      <div className="surface max-w-md space-y-4 rounded-xl p-5">
        <Toggle
          label="Maintenance mode"
          checked={form.maintenanceMode}
          onChange={(v) => setForm({ ...form, maintenanceMode: v })}
        />
        <Toggle
          label="Registrations enabled"
          checked={form.registrationsEnabled}
          onChange={(v) => setForm({ ...form, registrationsEnabled: v })}
        />
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground">Default daily goal</span>
          <input
            type="number"
            min={1}
            max={100}
            value={form.defaultDailyGoal}
            onChange={(e) => setForm({ ...form, defaultDailyGoal: Number(e.target.value) })}
            className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground">Current version</span>
          <input
            value={form.currentVersion}
            onChange={(e) => setForm({ ...form, currentVersion: e.target.value })}
            className="h-9 w-32 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-white/[0.12]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
