import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { useSession } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import {
  completeFollowUp,
  createFollowUp,
  deleteFollowUp,
  fetchClients,
  fetchFollowUps,
  rescheduleFollowUp,
} from "../../lib/queries";
import type { Client, FollowUpWithClient } from "../../types/client";
import FollowUpList from "./FollowUpList";
import NewFollowUpModal from "./NewFollowUpModal";
import EmptyState from "../ui/EmptyState";
import { SkeletonCardList } from "../ui/Skeleton";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function FollowUpsPage() {
  const { session } = useSession();
  const { showToast } = useToast();

  const [followUps, setFollowUps] = useState<FollowUpWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [followUpRows, clientRows] = await Promise.all([
        fetchFollowUps(),
        fetchClients(false),
      ]);
      setFollowUps(followUpRows);
      setClients(clientRows);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not load follow-ups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session]);

  const groups = useMemo(() => {
    const now = new Date();
    const pending = followUps.filter((item) => !item.completed);

    return {
      overdue: pending
        .filter((item) => new Date(item.scheduled_at) < now && !isSameLocalDay(new Date(item.scheduled_at), now))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
      today: pending
        .filter((item) => isSameLocalDay(new Date(item.scheduled_at), now))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
      upcoming: pending
        .filter((item) => new Date(item.scheduled_at) > now && !isSameLocalDay(new Date(item.scheduled_at), now))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    };
  }, [followUps]);

  async function handleComplete(item: FollowUpWithClient) {
    if (!session) return;
    setBusyId(item.id);
    try {
      await completeFollowUp(item, session.user.id);
      setFollowUps((current) => current.filter((row) => row.id !== item.id));
      showToast("success", "Follow-up completed.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not complete follow-up.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReschedule(item: FollowUpWithClient, scheduledAt: string) {
    if (!session) return;
    setBusyId(item.id);
    try {
      await rescheduleFollowUp(item, scheduledAt, session.user.id);
      setFollowUps((current) =>
        current.map((row) => (row.id === item.id ? { ...row, scheduled_at: scheduledAt } : row)),
      );
      showToast("info", "Follow-up rescheduled.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not reschedule follow-up.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: FollowUpWithClient) {
    setBusyId(item.id);
    try {
      await deleteFollowUp(item);
      setFollowUps((current) => current.filter((row) => row.id !== item.id));
      showToast("info", "Follow-up deleted.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not delete follow-up.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(clientId: string, scheduledAt: string, note: string) {
    if (!session) return;
    setSaving(true);
    try {
      await createFollowUp(clientId, session.user.id, scheduledAt, note || null);
      await load();
      setModalOpen(false);
      showToast("success", "Follow-up scheduled.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not schedule follow-up.");
    } finally {
      setSaving(false);
    }
  }

  const totalPending = groups.overdue.length + groups.today.length + groups.upcoming.length;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> New follow-up
        </button>
      </div>

      {loading ? (
        <SkeletonCardList count={4} />
      ) : totalPending === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={CalendarClock}
            title="You're all caught up 🎉"
            description="No follow-ups are scheduled right now."
          />
        </div>
      ) : (
        <div className="space-y-5">
          <FollowUpSection
            title="Overdue"
            tone="text-rose-600 dark:text-rose-400"
            items={groups.overdue}
            {...{ onComplete: handleComplete, onReschedule: handleReschedule, onDelete: handleDelete, busyId }}
          />
          <FollowUpSection
            title="Today"
            tone="text-indigo-600 dark:text-indigo-400"
            items={groups.today}
            {...{ onComplete: handleComplete, onReschedule: handleReschedule, onDelete: handleDelete, busyId }}
          />
          <FollowUpSection
            title="Upcoming"
            tone="text-slate-600 dark:text-slate-400"
            items={groups.upcoming}
            {...{ onComplete: handleComplete, onReschedule: handleReschedule, onDelete: handleDelete, busyId }}
          />
        </div>
      )}

      <NewFollowUpModal
        open={modalOpen}
        clients={clients}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={(clientId, scheduledAt, note) => void handleCreate(clientId, scheduledAt, note)}
      />
    </div>
  );
}

function FollowUpSection({
  title,
  tone,
  items,
  onComplete,
  onReschedule,
  onDelete,
  busyId,
}: {
  title: string;
  tone: string;
  items: FollowUpWithClient[];
  onComplete: (item: FollowUpWithClient) => void;
  onReschedule: (item: FollowUpWithClient, scheduledAt: string) => void;
  onDelete: (item: FollowUpWithClient) => void;
  busyId: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <section className="surface-card p-5">
      <h3 className={`text-sm font-semibold ${tone}`}>
        {title} <span className="text-slate-400">({items.length})</span>
      </h3>
      <FollowUpList
        items={items}
        onComplete={onComplete}
        onReschedule={onReschedule}
        onDelete={onDelete}
        busyId={busyId}
      />
    </section>
  );
}
