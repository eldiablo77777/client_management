import type { ClientPriority } from "../../types/client";

const STYLES: Record<ClientPriority, string> = {
  Low: "text-slate-500 dark:text-slate-400",
  Medium: "text-sky-600 dark:text-sky-400",
  High: "text-amber-600 dark:text-amber-400",
  Urgent: "text-rose-600 dark:text-rose-400",
};

const DOT: Record<ClientPriority, string> = {
  Low: "bg-slate-400",
  Medium: "bg-sky-500",
  High: "bg-amber-500",
  Urgent: "bg-rose-500",
};

export default function PriorityBadge({
  priority,
}: {
  priority: ClientPriority;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${STYLES[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[priority]}`} />
      {priority}
    </span>
  );
}
