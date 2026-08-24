import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Client, ClientActivity, Profile } from "../../types/client";
import { CALL_RESULTS, type CallResult } from "../../types/client";
import { fetchActivities, addActivity } from "../../lib/queries";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { useToast } from "../../lib/toast";
import StatusBadge from "../ui/StatusBadge";
import PriorityBadge from "../ui/PriorityBadge";
import ActivityTimeline from "./ActivityTimeline";

type LogType = "note" | "call" | "email" | "meeting";

export default function ClientDetails({
  client,
  profiles,
  userId,
  onClose,
  onEdit,
  onActivityLogged,
}: {
  client: Client;
  profiles: Profile[];
  userId: string;
  onClose: () => void;
  onEdit: () => void;
  onActivityLogged: () => void;
}) {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [logType, setLogType] = useState<LogType>("note");
  const [callResult, setCallResult] = useState<CallResult>("No answer");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((profile) => map.set(profile.id, profile));
    return map;
  }, [profiles]);

  function authorEmail(userIdValue: string | null): string {
    if (!userIdValue) return "System";
    return profilesById.get(userIdValue)?.full_name || profilesById.get(userIdValue)?.email || "Team member";
  }

  async function loadActivities() {
    setLoadingActivities(true);
    try {
      setActivities(await fetchActivities(client.id));
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not load activity.");
    } finally {
      setLoadingActivities(false);
    }
  }

  useEffect(() => {
    void loadActivities();
    setLogType("note");
    setText("");
  }, [client.id]);

  async function handleLogSubmit() {
    if (logType !== "call" && !text.trim()) return;

    setSubmitting(true);
    try {
      if (logType === "call") {
        await addActivity(
          client.id,
          userId,
          "call",
          text.trim() ? `${callResult} — ${text.trim()}` : callResult,
          { result: callResult },
        );
      } else {
        await addActivity(client.id, userId, logType, text.trim());
      }

      setText("");
      await loadActivities();
      onActivityLogged();
      showToast("success", "Activity logged.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not log activity.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {client.company_name}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={client.status} />
              <PriorityBadge priority={client.priority} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary" onClick={onEdit}>
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Company information
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Contact person" value={client.contact_person} />
              <Detail label="Phone" value={client.phone_number} />
              <Detail label="Email" value={client.email} />
              <Detail label="Website" value={client.website} />
              <Detail label="Address" value={client.address} full />
            </dl>
          </section>

          <section className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              CRM information
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail
                label="Assigned to"
                value={
                  client.assigned_to
                    ? profilesById.get(client.assigned_to)?.full_name ||
                      profilesById.get(client.assigned_to)?.email ||
                      null
                    : null
                }
              />
              <Detail label="Lead source" value={client.lead_source} />
              <Detail label="Project value" value={formatCurrency(client.project_value)} />
              <Detail label="Expected close" value={formatDate(client.expected_close_date)} />
              <Detail label="Created" value={formatDate(client.created_at)} />
              <Detail label="Last contacted" value={formatDate(client.last_contacted_at)} />
              <Detail
                label="Next follow-up"
                value={
                  client.follow_up_date
                    ? formatDateTime(`${client.follow_up_date}T${client.follow_up_time ?? "09:00"}`)
                    : null
                }
              />
            </dl>
          </section>

          {client.requirements && (
            <section className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                {client.requirements}
              </p>
            </section>
          )}

          <section className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activity</h3>

            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex gap-1.5">
                {(["note", "call", "email", "meeting"] as LogType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLogType(type)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                      logType === type
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {logType === "call" && (
                <select
                  className="input-field"
                  value={callResult}
                  onChange={(event) => setCallResult(event.target.value as CallResult)}
                >
                  {CALL_RESULTS.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              )}

              <textarea
                className="input-field resize-y"
                rows={2}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  logType === "note"
                    ? "Add a note…"
                    : logType === "call"
                      ? "Optional call notes…"
                      : `${logType === "email" ? "Email" : "Meeting"} summary…`
                }
              />

              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting || (logType !== "call" && !text.trim())}
                onClick={() => void handleLogSubmit()}
              >
                {submitting ? "Saving…" : "Add to timeline"}
              </button>
            </div>

            <div className="mt-5">
              {loadingActivities ? (
                <p className="py-8 text-center text-sm text-slate-400">Loading activity…</p>
              ) : (
                <ActivityTimeline
                  activities={activities}
                  authorEmail={authorEmail}
                  onChanged={() => {
                    void loadActivities();
                  }}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  full,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{value || "—"}</dd>
    </div>
  );
}
