import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Client, ClientFormData } from "../types/client";
import { createClient, updateClient } from "../lib/queries";
import { useToast } from "../lib/toast";

function emptyForm(): ClientFormData {
  return {
    company_name: "",
    phone_number: "",
    contact_person: "",
    email: "",
    interested: false,
    requirements: "",
    landed: false,
  };
}

function formFromClient(client: Client): ClientFormData {
  return {
    company_name: client.company_name,
    phone_number: client.phone_number,
    contact_person: client.contact_person ?? "",
    email: client.email ?? "",
    interested: client.interested,
    requirements: client.requirements ?? "",
    landed: client.landed,
  };
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
          value
            ? "bg-emerald-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
          !value
            ? "bg-slate-700 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        No
      </button>
    </div>
  );
}

export default function ClientModal({
  open,
  client,
  onClose,
  onSaved,
}: {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const isEdit = client !== null;

  useEffect(() => {
    if (open) {
      setForm(client ? formFromClient(client) : emptyForm());
      setError("");
    }
  }, [open, client]);

  if (!open) return null;

  function update<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company_name.trim() || !form.phone_number.trim()) {
      setError("Company name and phone number are required.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const saved = isEdit
        ? await updateClient(client!.id, form)
        : await createClient(form);

      showToast("success", isEdit ? "Client updated." : "Client added.");
      onSaved(saved);
      onClose();
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        isEdit ? "Could not update client." : "Could not add client.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit client" : "Add client"}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {isEdit ? "Edit client" : "Add client"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4 px-6 py-5"
        >
          <div>
            <label className="field-label" htmlFor="client-company">
              Company Name *
            </label>
            <input
              id="client-company"
              className="input-field"
              value={form.company_name}
              onChange={(event) => update("company_name", event.target.value)}
              placeholder="Acme Ltd."
              autoFocus
            />
          </div>

          <div>
            <label className="field-label" htmlFor="client-phone">
              Phone Number *
            </label>
            <input
              id="client-phone"
              className="input-field"
              type="tel"
              value={form.phone_number}
              onChange={(event) => update("phone_number", event.target.value)}
              placeholder="+389 XX XXX XXX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="client-contact">
                Contact Person
              </label>
              <input
                id="client-contact"
                className="input-field"
                value={form.contact_person}
                onChange={(event) =>
                  update("contact_person", event.target.value)
                }
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="client-email">
                Email
              </label>
              <input
                id="client-email"
                className="input-field"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <span className="field-label">Interested</span>
              <YesNoToggle
                value={form.interested}
                onChange={(value) => update("interested", value)}
              />
            </div>

            <div>
              <span className="field-label">Landed</span>
              <YesNoToggle
                value={form.landed}
                onChange={(value) => update("landed", value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="client-requirements">
              Requirements
            </label>
            <textarea
              id="client-requirements"
              className="input-field resize-y"
              rows={4}
              value={form.requirements}
              onChange={(event) =>
                update("requirements", event.target.value)
              }
              placeholder="What they said, what they want…"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
