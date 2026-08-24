import { Archive, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { Client, ClientStatus, Profile } from "../../types/client";
import { formatCurrency, formatDate } from "../../lib/format";
import PriorityBadge from "../ui/PriorityBadge";
import InlineStatusSelect from "./InlineStatusSelect";
import ActionMenu from "../ui/ActionMenu";
import { SkeletonTableRows } from "../ui/Skeleton";

type ClientTableProps = {
  clients: Client[];
  profilesById: Map<string, Profile>;
  loading: boolean;
  showArchived: boolean;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
  onDelete: (client: Client) => void;
  onStatusChange: (client: Client, status: ClientStatus) => void;
};

export default function ClientTable({
  clients,
  profilesById,
  loading,
  showArchived,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onStatusChange,
}: ClientTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-3 py-3 font-medium">Company</th>
            <th className="px-3 py-3 font-medium">Contact</th>
            <th className="px-3 py-3 font-medium">Phone</th>
            <th className="px-3 py-3 font-medium">Email</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Priority</th>
            <th className="px-3 py-3 font-medium">Assigned</th>
            <th className="px-3 py-3 font-medium">Follow-up</th>
            <th className="px-3 py-3 font-medium">Value</th>
            <th className="px-3 py-3 font-medium">Last contacted</th>
            <th className="px-3 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <SkeletonTableRows rows={6} columns={11} />
          ) : (
            clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-slate-100 align-middle hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/40"
              >
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onView(client)}
                    className="focus-ring rounded text-left font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                  >
                    {client.company_name}
                  </button>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {client.contact_person || "—"}
                </td>
                <td className="px-3 py-3">
                  <a
                    href={`tel:${client.phone_number}`}
                    className="text-slate-600 hover:underline dark:text-slate-300"
                  >
                    {client.phone_number}
                  </a>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {client.email || "—"}
                </td>
                <td className="px-3 py-3">
                  <InlineStatusSelect
                    status={client.status}
                    disabled={showArchived}
                    onChange={(status) => onStatusChange(client, status)}
                  />
                </td>
                <td className="px-3 py-3">
                  <PriorityBadge priority={client.priority} />
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {client.assigned_to
                    ? profilesById.get(client.assigned_to)?.full_name ||
                      profilesById.get(client.assigned_to)?.email ||
                      "—"
                    : "Unassigned"}
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {formatDate(client.follow_up_date)}
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {formatCurrency(client.project_value)}
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                  {formatDate(client.last_contacted_at)}
                </td>
                <td className="px-3 py-3 text-right">
                  <ActionMenu
                    items={
                      showArchived
                        ? [
                            { label: "View", icon: Eye, onSelect: () => onView(client) },
                            {
                              label: "Restore",
                              icon: RotateCcw,
                              onSelect: () => onRestore(client),
                            },
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
                            {
                              label: "Archive",
                              icon: Archive,
                              onSelect: () => onArchive(client),
                            },
                          ]
                    }
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
