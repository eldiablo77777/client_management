import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Client } from "../../types/client";

export default function NewFollowUpModal({
  open,
  clients,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  clients: Client[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (clientId: string, scheduledAt: string, note: string) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId) {
      setError("Choose a client.");
      return;
    }
    if (!date) {
      setError("Choose a date.");
      return;
    }

    setError("");
    onSubmit(clientId, new Date(`${date}T${time}`).toISOString(), note.trim());
    setClientId("");
    setDate("");
    setTime("09:00");
    setNote("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            New follow-up
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="follow-up-client" className="field-label">Client</label>
            <select
              id="follow-up-client"
              className="input-field"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            >
              <option value="">Select a client…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="follow-up-date" className="field-label">Date</label>
              <input
                id="follow-up-date"
                type="date"
                className="input-field"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="follow-up-time" className="field-label">Time</label>
              <input
                id="follow-up-time"
                type="time"
                className="input-field"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="follow-up-note" className="field-label">Note</label>
            <textarea
              id="follow-up-note"
              className="input-field resize-y"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What's this follow-up about?"
            />
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Schedule follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
