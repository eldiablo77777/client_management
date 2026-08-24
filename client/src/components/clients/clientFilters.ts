import type { Client, ClientPriority, ClientStatus } from "../../types/client";

export type SortField =
  | "company_name"
  | "created_at"
  | "updated_at"
  | "status"
  | "priority"
  | "follow_up_date"
  | "project_value";

export type FollowUpBucket = "all" | "today" | "upcoming" | "overdue" | "none";

export type ClientFilters = {
  search: string;
  status: ClientStatus | "all";
  priority: ClientPriority | "all";
  followUp: FollowUpBucket;
  assignedTo: string | "all";
  sortField: SortField;
  sortDirection: "asc" | "desc";
};

export function defaultFilters(): ClientFilters {
  return {
    search: "",
    status: "all",
    priority: "all",
    followUp: "all",
    assignedTo: "all",
    sortField: "created_at",
    sortDirection: "desc",
  };
}

export function followUpBucketFor(client: Client): FollowUpBucket {
  if (!client.follow_up_date) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUpDate = new Date(`${client.follow_up_date}T00:00:00`);

  if (followUpDate.getTime() === today.getTime()) return "today";
  if (followUpDate.getTime() < today.getTime()) return "overdue";
  return "upcoming";
}

const PRIORITY_ORDER: Record<ClientPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
};

export function applyClientFilters(
  clients: Client[],
  filters: ClientFilters,
): Client[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = clients.filter((client) => {
    const matchesSearch =
      !search ||
      client.company_name.toLowerCase().includes(search) ||
      (client.contact_person ?? "").toLowerCase().includes(search) ||
      client.phone_number.toLowerCase().includes(search) ||
      (client.email ?? "").toLowerCase().includes(search) ||
      (client.requirements ?? "").toLowerCase().includes(search);

    const matchesStatus = filters.status === "all" || client.status === filters.status;
    const matchesPriority =
      filters.priority === "all" || client.priority === filters.priority;
    const matchesFollowUp =
      filters.followUp === "all" || followUpBucketFor(client) === filters.followUp;
    const matchesAssigned =
      filters.assignedTo === "all" || client.assigned_to === filters.assignedTo;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesFollowUp &&
      matchesAssigned
    );
  });

  const direction = filters.sortDirection === "asc" ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (filters.sortField) {
      case "company_name":
        return direction * a.company_name.localeCompare(b.company_name);
      case "status":
        return direction * a.status.localeCompare(b.status);
      case "priority":
        return direction * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      case "project_value":
        return direction * ((a.project_value ?? 0) - (b.project_value ?? 0));
      case "follow_up_date": {
        const aTime = a.follow_up_date ? new Date(a.follow_up_date).getTime() : 0;
        const bTime = b.follow_up_date ? new Date(b.follow_up_date).getTime() : 0;
        return direction * (aTime - bTime);
      }
      case "updated_at":
        return direction * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case "created_at":
      default:
        return (
          direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        );
    }
  });
}
