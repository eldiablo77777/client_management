import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { fetchClients, fetchFollowUps } from "../../lib/queries";
import type { Client, ClientStatus, FollowUpWithClient } from "../../types/client";
import { CLIENT_STATUSES } from "../../types/client";
import { formatCurrency } from "../../lib/format";
import StatusBadge from "../ui/StatusBadge";
import { SkeletonStatCard } from "../ui/Skeleton";

const STATUS_BAR_COLOR: Record<ClientStatus, string> = {
  New: "bg-sky-500",
  Contacted: "bg-slate-500",
  Interested: "bg-violet-500",
  Negotiating: "bg-amber-500",
  Won: "bg-emerald-500",
  Lost: "bg-rose-500",
};

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

export default function AnalyticsPage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    let active = true;
    async function load() {
      try {
        const [clientRows, followUpRows] = await Promise.all([
          fetchClients(true),
          fetchFollowUps(),
        ]);
        if (!active) return;
        setClients(clientRows.filter((client) => !client.archived));
        setFollowUps(followUpRows);
      } catch (error) {
        showToast("error", error instanceof Error ? error.message : "Could not load analytics.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [session]);

  const pipeline = useMemo(() => {
    const counts = new Map<ClientStatus, number>();
    CLIENT_STATUSES.forEach((status) => counts.set(status, 0));
    clients.forEach((client) => counts.set(client.status, (counts.get(client.status) ?? 0) + 1));
    return CLIENT_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  }, [clients]);

  const conversionRate = useMemo(() => {
    if (clients.length === 0) return null;
    const won = clients.filter((client) => client.status === "Won").length;
    return (won / clients.length) * 100;
  }, [clients]);

  const revenue = useMemo(() => {
    const wonClients = clients.filter((client) => client.status === "Won");
    const withValue = clients.filter((client) => client.project_value !== null);

    return {
      totalPotential: clients.reduce((sum, client) => sum + (client.project_value ?? 0), 0),
      won: wonClients.reduce((sum, client) => sum + (client.project_value ?? 0), 0),
      average:
        withValue.length > 0
          ? withValue.reduce((sum, client) => sum + (client.project_value ?? 0), 0) / withValue.length
          : null,
    };
  }, [clients]);

  const monthlyClients = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; count: number }[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextBucket = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = clients.filter((client) => {
        const created = new Date(client.created_at);
        return created >= bucketDate && created < nextBucket;
      }).length;
      buckets.push({ label: monthLabel(bucketDate), count });
    }

    return buckets;
  }, [clients]);

  const followUpPerformance = useMemo(() => {
    const now = new Date();
    const completed = followUps.filter((item) => item.completed).length;
    const overdue = followUps.filter(
      (item) => !item.completed && new Date(item.scheduled_at) < now,
    ).length;
    const upcoming = followUps.filter(
      (item) => !item.completed && new Date(item.scheduled_at) >= now,
    ).length;

    return { completed, overdue, upcoming };
  }, [followUps]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>
    );
  }

  const maxPipelineCount = Math.max(1, ...pipeline.map((item) => item.count));
  const maxMonthlyCount = Math.max(1, ...monthlyClients.map((item) => item.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Conversion rate"
          value={conversionRate === null ? "—" : `${conversionRate.toFixed(1)}%`}
          hint="Won ÷ total clients"
        />
        <SummaryTile label="Total potential value" value={formatCurrency(revenue.totalPotential)} />
        <SummaryTile label="Won revenue" value={formatCurrency(revenue.won)} />
        <SummaryTile label="Average project value" value={formatCurrency(revenue.average)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Client pipeline
          </h3>
          <div className="mt-4 space-y-3">
            {pipeline.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <StatusBadge status={item.status} />
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_COLOR[item.status]}`}
                    style={{ width: `${(item.count / maxPipelineCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-600 dark:text-slate-300">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            New clients per month
          </h3>
          <div className="mt-6 flex h-40 items-end gap-3">
            {monthlyClients.map((bucket) => (
              <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-indigo-500"
                    style={{ height: `${(bucket.count / maxMonthlyCount) * 100}%`, minHeight: bucket.count > 0 ? "4px" : 0 }}
                    title={`${bucket.count} clients`}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{bucket.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Follow-up performance
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {followUpPerformance.completed}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
              {followUpPerformance.upcoming}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upcoming</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
              {followUpPerformance.overdue}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Overdue</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
