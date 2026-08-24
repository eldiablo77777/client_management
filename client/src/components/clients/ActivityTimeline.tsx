import { useState } from "react";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import type { ActivityType, ClientActivity } from "../../types/client";
import { formatRelativeTime } from "../../lib/format";
import { deleteActivity, updateActivityNote } from "../../lib/queries";
import { useToast } from "../../lib/toast";

const ICONS: Record<ActivityType, typeof Phone> = {
  created: Sparkles,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: MessageSquare,
  status_change: CheckCircle2,
  follow_up: CalendarClock,
  archived: Archive,
  restored: RotateCcw,
};

export default function ActivityTimeline({
  activities,
  authorEmail,
  onChanged,
}: {
  activities: ClientActivity[];
  authorEmail: (userId: string | null) => string;
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No activity recorded yet.
      </p>
    );
  }

  function startEdit(activity: ClientActivity) {
    setEditingId(activity.id);
    setDraft(activity.description);
  }

  async function saveEdit(activityId: string) {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await updateActivityNote(activityId, draft.trim());
      setEditingId(null);
      onChanged();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not update note.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(activityId: string) {
    setBusy(true);
    try {
      await deleteActivity(activityId);
      onChanged();
      showToast("info", "Note deleted.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not delete note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const Icon = ICONS[activity.type];
        const isNote = activity.type === "note";
        const isEditing = editingId === activity.id;

        return (
          <li key={activity.id} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Icon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1 pb-1">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    className="input-field resize-y"
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary !px-3 !py-1.5 text-xs"
                      disabled={busy}
                      onClick={() => void saveEdit(activity.id)}
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
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-200">{activity.description}</p>
              )}

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span>{authorEmail(activity.user_id)}</span>
                <span aria-hidden="true">·</span>
                <span title={new Date(activity.created_at).toLocaleString()}>
                  {formatRelativeTime(activity.created_at)}
                </span>

                {isNote && !isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(activity)}
                      className="focus-ring ml-1 inline-flex items-center gap-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Edit note"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(activity.id)}
                      disabled={busy}
                      className="focus-ring inline-flex items-center gap-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
