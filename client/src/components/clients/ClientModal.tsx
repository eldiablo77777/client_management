import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  CLIENT_PRIORITIES,
  CLIENT_STATUSES,
  type Client,
  type ClientFormData,
  type Profile,
} from "../../types/client";
import { createClient, updateClient } from "../../lib/queries";
import { useToast } from "../../lib/toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyForm(): ClientFormData {
  return {
    company_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    website: "",
    address: "",
    status: "New",
    priority: "Medium",
    lead_source: "",
    assigned_to: "",
    project_value: "",
    expected_close_date: "",
    follow_up_date: "",
    follow_up_time: "",
    requirements: "",
  };
}

function formFromClient(client: Client): ClientFormData {
  return {
    company_name: client.company_name,
    contact_person: client.contact_person ?? "",
    phone_number: client.phone_number,
    email: client.email ?? "",
    website: client.website ?? "",
    address: client.address ?? "",
    status: client.status,
    priority: client.priority,
    lead_source: client.lead_source ?? "",
    assigned_to: client.assigned_to ?? "",
    project_value: client.project_value?.toString() ?? "",
    expected_close_date: client.expected_close_date ?? "",
    follow_up_date: client.follow_up_date ?? "",
    follow_up_time: client.follow_up_time ?? "",
    requirements: client.requirements ?? "",
  };
}

export default function ClientModal({
  open,
  client,
  profiles,
  userId,
  onClose,
  onSaved,
}: {
  open: boolean;
  client: Client | null;
  profiles: Profile[];
  userId: string;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(client ? formFromClient(client) : emptyForm());
      setErrors({});
    }
  }, [open, client]);

  if (!open) return null;

  function update<K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!form.company_name.trim()) {
      nextErrors.company_name = "Company name is required.";
    }

    if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.project_value.trim() && Number.isNaN(Number(form.project_value))) {
      nextErrors.project_value = "Enter a valid number.";
    }

    if (form.follow_up_time.trim() && !form.follow_up_date.trim()) {
      nextErrors.follow_up_date = "Pick a follow-up date to go with the time.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const saved = client
        ? await updateClient(client, form, userId)
        : await createClient(form, userId);

      showToast(
        "success",
        client ? "Client updated successfully." : "Client added successfully.",
      );
      onSaved(saved);
      onClose();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not save client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={client ? "Edit client" : "Add client"}
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {client ? "Edit client" : "Add client"}
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

        <form onSubmit={(event) => void handleSubmit(event)} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Company information
              </h3>

              <Field label="Company name" required error={errors.company_name}>
                <input
                  className="input-field"
                  value={form.company_name}
                  onChange={(event) => update("company_name", event.target.value)}
                  placeholder="Acme Ltd."
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact person">
                  <input
                    className="input-field"
                    value={form.contact_person}
                    onChange={(event) => update("contact_person", event.target.value)}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className="input-field"
                    type="tel"
                    value={form.phone_number}
                    onChange={(event) => update("phone_number", event.target.value)}
                    placeholder="+1…"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Email" error={errors.email}>
                  <input
                    className="input-field"
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="jane@acme.com"
                  />
                </Field>
                <Field label="Website">
                  <input
                    className="input-field"
                    type="text"
                    value={form.website}
                    onChange={(event) => update("website", event.target.value)}
                    placeholder="acme.com"
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  className="input-field"
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="123 Main St, City"
                />
              </Field>
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                CRM information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(event) => update("status", event.target.value as ClientFormData["status"])}
                  >
                    {CLIENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={(event) =>
                      update("priority", event.target.value as ClientFormData["priority"])
                    }
                  >
                    {CLIENT_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Lead source">
                  <input
                    className="input-field"
                    value={form.lead_source}
                    onChange={(event) => update("lead_source", event.target.value)}
                    placeholder="Referral, website…"
                  />
                </Field>
                <Field label="Assigned to">
                  <select
                    className="input-field"
                    value={form.assigned_to}
                    onChange={(event) => update("assigned_to", event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Project value" error={errors.project_value}>
                  <input
                    className="input-field"
                    type="text"
                    inputMode="decimal"
                    value={form.project_value}
                    onChange={(event) => update("project_value", event.target.value)}
                    placeholder="5000"
                  />
                </Field>
                <Field label="Expected close date">
                  <input
                    className="input-field"
                    type="date"
                    value={form.expected_close_date}
                    onChange={(event) => update("expected_close_date", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Follow-up date" error={errors.follow_up_date}>
                  <input
                    className="input-field"
                    type="date"
                    value={form.follow_up_date}
                    onChange={(event) => update("follow_up_date", event.target.value)}
                  />
                </Field>
                <Field label="Follow-up time">
                  <input
                    className="input-field"
                    type="time"
                    value={form.follow_up_time}
                    onChange={(event) => update("follow_up_time", event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
              <label htmlFor="client-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes
              </label>
              <textarea
                id="client-notes"
                className="input-field resize-y"
                rows={4}
                value={form.requirements}
                onChange={(event) => update("requirements", event.target.value)}
                placeholder="Requirements, context, anything worth remembering…"
              />
            </section>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : client ? "Save changes" : "Add client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block">
        <span className="field-label">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
        {children}
      </label>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
