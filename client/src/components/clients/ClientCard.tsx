import { Archive, Eye, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import type { Client, Profile } from "../../types/client";
import { formatCurrency, formatDate } from "../../lib/format";
import StatusBadge from "../ui/StatusBadge";
import PriorityBadge from "../ui/PriorityBadge";
import ActionMenu from "../ui/ActionMenu";
import { SkeletonCardList } from "../ui/Skeleton";

type ClientCardProps = {
  clients: Client[];
  profilesById: Map<string, Profile>;
  loading: boolean;
  showArchived: boolean;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export default function ClientCard({
  clients,
  profilesById,
  loading,
  showArchived,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: ClientCardProps) {
  if (loading) {
    return (
      <div className="md:hidden">
        <SkeletonCardList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {clients.map((client) => (
        <div key={client.id} className="surface-card p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onView(client)}
              className="focus-ring min-w-0 flex-1 text-left"
            >
              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                {client.company_name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {client.contact_person || "No contact"}
              </p>
            </button>

            <ActionMenu
              items={
                showArchived
                  ? [
                      { label: "View", icon: Eye, onSelect: () => onView(client) },
                      { label: "Restore", icon: RotateCcw, onSelect: () => onRestore(client) },
                      {
                        label: "Delete permanently",
                        icon: Trash2,
                        tone: "danger",
                        onSelect: () => onDelete(client),
                      },
                    ]
                  : [
                      { label: "View", icon: Eye, onSelect: () => onView(client) },
                      { label: "Edit", icon: Pencil, onSelect: () => onEdit(client) },
                      { label: "Archive", icon: Archive, onSelect: () => onArchive(client) },
                    ]
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={client.status} />
            <PriorityBadge priority={client.priority} />
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
            <dt className="text-slate-400">Phone</dt>
            <dd className="text-right text-slate-600 dark:text-slate-300">
              <a href={`tel:${client.phone_number}`} className="inline-flex items-center gap-1 hover:underline">
                <Phone className="h-3 w-3" /> {client.phone_number}
              </a>
            </dd>
            <dt className="text-slate-400">Assigned</dt>
            <dd className="text-right text-slate-600 dark:text-slate-300">
              {client.assigned_to
                ? profilesById.get(client.assigned_to)?.full_name ||
                  profilesById.get(client.assigned_to)?.email ||
                  "—"
                : "Unassigned"}
            </dd>
            <dt className="text-slate-400">Follow-up</dt>
            <dd className="text-right text-slate-600 dark:text-slate-300">
              {formatDate(client.follow_up_date)}
            </dd>
            <dt className="text-slate-400">Value</dt>
            <dd className="text-right text-slate-600 dark:text-slate-300">
              {formatCurrency(client.project_value)}
            </dd>
          </dl>
        </div>
      ))}
    </div>
  );
}
