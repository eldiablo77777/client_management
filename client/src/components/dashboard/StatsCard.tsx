import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

export type Trend = { direction: "up" | "down"; label: string } | null;

export default function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "indigo",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: Trend;
  accent?: "indigo" | "emerald" | "amber" | "violet" | "sky" | "rose";
}) {
  const accentClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  };

  return (
    <article className="surface-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]}`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend.direction === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trend.label}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </article>
  );
}
