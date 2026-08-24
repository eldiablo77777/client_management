import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { FollowUpWithClient } from "../../types/client";
import { formatDateTime } from "../../lib/format";

export default function FollowUpList({
  items,
  onComplete,
  onReschedule,
  onDelete,
  busyId,
}: {
  items: FollowUpWithClient[];
  onComplete: (item: FollowUpWithClient) => void;
  onReschedule: (item: FollowUpWithClient, scheduledAt: string) => void;
  onDelete: (item: FollowUpWithClient) => void;
  busyId: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startReschedule(item: FollowUpWithClient) {
    setEditingId(item.id);
    setDraft(toLocalInputValue(item.scheduled_at));
  }

  function submitReschedule(item: FollowUpWithClient) {
    if (!draft) return;
    onReschedule(item, new Date(draft).toISOString());
    setEditingId(null);
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => {
        const isEditing = editingId === item.id;
        const isBusy = busyId === item.id;

        return (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <a
                href={`/clients?open=${item.client_id}`}
                className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
              >
                {item.client?.company_name ?? "Unknown client"}
              </a>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.client?.contact_person ? `${item.client.contact_person} · ` : ""}
                {formatDateTime(item.scheduled_at)}
              </p>
              {item.note && (
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{item.note}</p>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="input-field !w-auto"
                />
                <button
                  type="button"
                  className="btn btn-primary !px-3 !py-1.5 text-xs"
                  onClick={() => submitReschedule(item)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !px-3 !py-1.5 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onComplete(item)}
                  className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  <Check className="h-3.5 w-3.5" /> Complete
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => startReschedule(item)}
                  className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-3.5 w-3.5" /> Reschedule
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onDelete(item)}
                  className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
