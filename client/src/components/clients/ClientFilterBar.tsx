import { ArrowDownAZ, ArrowUpAZ, Plus, Search, X } from "lucide-react";
import { CLIENT_PRIORITIES, CLIENT_STATUSES } from "../../types/client";
import type { Profile } from "../../types/client";
import type { ClientFilters, SortField } from "./clientFilters";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "company_name", label: "Company" },
  { value: "created_at", label: "Created date" },
  { value: "updated_at", label: "Updated date" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "follow_up_date", label: "Follow-up date" },
  { value: "project_value", label: "Project value" },
];

export default function ClientFilterBar({
  filters,
  onChange,
  profiles,
  showArchived,
  onToggleArchived,
  onAddClient,
  resultCount,
  totalCount,
  hideStatusFilter,
}: {
  filters: ClientFilters;
  onChange: (filters: ClientFilters) => void;
  profiles: Profile[];
  showArchived: boolean;
  onToggleArchived: () => void;
  onAddClient: () => void;
  resultCount: number;
  totalCount: number;
  hideStatusFilter?: boolean;
}) {
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.followUp !== "all" ||
    filters.assignedTo !== "all";

  function update<K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onChange({
      ...filters,
      search: "",
      status: "all",
      priority: "all",
      followUp: "all",
      assignedTo: "all",
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {resultCount} of {totalCount} clients
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-secondary" onClick={onToggleArchived}>
            {showArchived ? "Show active" : "Show archived"}
          </button>
          {!showArchived && (
            <button type="button" className="btn btn-primary" onClick={onAddClient}>
              <Plus className="h-4 w-4" /> Add client
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Search clients…"
            className="input-field pl-9"
          />
        </div>

        {!hideStatusFilter && (
          <select
            value={filters.status}
            onChange={(event) => update("status", event.target.value as ClientFilters["status"])}
            className="input-field lg:w-40"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.priority}
          onChange={(event) =>
            update("priority", event.target.value as ClientFilters["priority"])
          }
          className="input-field lg:w-36"
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          {CLIENT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select
          value={filters.followUp}
          onChange={(event) =>
            update("followUp", event.target.value as ClientFilters["followUp"])
          }
          className="input-field lg:w-40"
          aria-label="Filter by follow-up"
        >
          <option value="all">All follow-ups</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="none">No follow-up</option>
        </select>

        <select
          value={filters.assignedTo}
          onChange={(event) => update("assignedTo", event.target.value)}
          className="input-field lg:w-40"
          aria-label="Filter by assigned team member"
        >
          <option value="all">All team members</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name || profile.email}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <select
            value={filters.sortField}
            onChange={(event) => update("sortField", event.target.value as SortField)}
            className="input-field lg:w-40"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              update("sortDirection", filters.sortDirection === "asc" ? "desc" : "asc")
            }
            className="focus-ring rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={filters.sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
          >
            {filters.sortDirection === "asc" ? (
              <ArrowUpAZ className="h-4 w-4" />
            ) : (
              <ArrowDownAZ className="h-4 w-4" />
            )}
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
