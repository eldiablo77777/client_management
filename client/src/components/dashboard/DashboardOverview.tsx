import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  DollarSign,
  Target,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth";
import { fetchClients, fetchFollowUps } from "../../lib/queries";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useToast } from "../../lib/toast";
import type { Client, FollowUpWithClient } from "../../types/client";
import StatsCard, { type Trend } from "./StatsCard";
import StatusBadge from "../ui/StatusBadge";
import { SkeletonStatCard } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthTrend(clients: Client[]): Trend {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthCount = clients.filter(
    (client) => new Date(client.created_at) >= startOfThisMonth,
  ).length;
  const lastMonthCount = clients.filter((client) => {
    const created = new Date(client.created_at);
    return created >= startOfLastMonth && created < startOfThisMonth;
  }).length;

  if (lastMonthCount === 0) {
    if (thisMonthCount === 0) return null;
    return { direction: "up", label: `+${thisMonthCount} this month` };
  }

  const change = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
  if (change === 0) return null;

  return {
    direction: change > 0 ? "up" : "down",
    label: `${change > 0 ? "+" : ""}${change.toFixed(1)}% this month`,
  };
}

export default function DashboardOverview() {
  const { session } = useSession();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const currentSession = session;
    let active = true;

    async function load() {
      try {
        const [clientRows, followUpRows, profile] = await Promise.all([
          fetchClients(false),
          fetchFollowUps(),
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", currentSession.user.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        setClients(clientRows);
        setFollowUps(followUpRows);
        setDisplayName(
          profile.data?.full_name || currentSession.user.email?.split("@")[0] || "there",
        );
      } catch (error) {
        showToast(
          "error",
          error instanceof Error ? error.message : "Could not load dashboard data.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [session]);

  const stats = useMemo(() => {
    const now = new Date();
    const newLeads = clients.filter((client) => client.status === "New").length;
    const interested = clients.filter((client) => client.status === "Interested").length;
    const won = clients.filter((client) => client.status === "Won").length;
    const revenue = clients
      .filter((client) => client.status === "Won")
      .reduce((sum, client) => sum + (client.project_value ?? 0), 0);
    const followUpsToday = followUps.filter(
      (item) => !item.completed && isSameLocalDay(new Date(item.scheduled_at), now),
    ).length;

    return {
      total: clients.length,
      newLeads,
      interested,
      won,
      revenue,
      followUpsToday,
    };
  }, [clients, followUps]);

  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);

  const todayFollowUps = useMemo(() => {
    const now = new Date();
    return followUps
      .filter((item) => !item.completed && isSameLocalDay(new Date(item.scheduled_at), now))
      .slice(0, 5);
  }, [followUps]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {greeting()}, {displayName || "…"} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here's what's happening with your clients today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <SkeletonStatCard key={index} />)
        ) : (
          <>
            <StatsCard
              label="Total clients"
              value={stats.total.toString()}
              icon={Users}
              accent="indigo"
              trend={monthTrend(clients)}
            />
            <StatsCard
              label="New leads"
              value={stats.newLeads.toString()}
              icon={UserPlus}
              accent="sky"
            />
            <StatsCard
              label="Interested"
              value={stats.interested.toString()}
              icon={Target}
              accent="violet"
            />
            <StatsCard
              label="Follow-ups today"
              value={stats.followUpsToday.toString()}
              icon={CalendarClock}
              accent="amber"
            />
            <StatsCard
              label="Won"
              value={stats.won.toString()}
              icon={Trophy}
              accent="emerald"
            />
            <StatsCard
              label="Revenue (won)"
              value={formatCurrency(stats.revenue)}
              icon={DollarSign}
              accent="emerald"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Follow-ups due today
          </h3>

          {!loading && todayFollowUps.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="You're all caught up 🎉"
              description="No follow-ups are due today."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {todayFollowUps.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.client?.company_name ?? "Unknown client"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(item.scheduled_at)}
                    </p>
                  </div>
                  <a href="/follow-ups" className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-xs">
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recent clients
          </h3>

          {!loading && recentClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start building your pipeline."
              action={{ label: "Add client", onClick: () => (window.location.href = "/clients") }}
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {recentClients.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {client.company_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {client.contact_person || "No contact"}
                    </p>
                  </div>
                  <StatusBadge status={client.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
