import { CLIENT_STATUSES, type ClientStatus } from "../../types/client";

const DOT: Record<ClientStatus, string> = {
  New: "bg-sky-500",
  Contacted: "bg-slate-500",
  Interested: "bg-violet-500",
  Negotiating: "bg-amber-500",
  Won: "bg-emerald-500",
  Lost: "bg-rose-500",
};

export default function InlineStatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: ClientStatus;
  disabled?: boolean;
  onChange: (status: ClientStatus) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <span
        className={`pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full ${DOT[status]}`}
        aria-hidden="true"
      />
      <select
        value={status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ClientStatus)}
        aria-label="Client status"
        className="focus-ring cursor-pointer appearance-none rounded-full border border-slate-200 bg-white py-1 pl-6 pr-6 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {CLIENT_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
