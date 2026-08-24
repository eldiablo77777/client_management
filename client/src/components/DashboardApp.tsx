import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import type { Client, ClientFormData } from "../types/client";

type DashboardFormData = ClientFormData & {
  called: boolean;
  interested: boolean;
  requirements: string;
};

const emptyForm: DashboardFormData = {
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
  called: false,
  interested: false,
  requirements: "",
};

export default function DashboardApp() {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<DashboardFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "called" | "uncalled" | "interested" | "not-interested"
  >("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setEmail(session.user.email ?? "Authenticated user");
      await loadClients();
    }

    void initialize();
  }, []);

  async function loadClients() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`Could not load clients: ${error.message}`);
      setLoading(false);
      return;
    }

    setClients((data ?? []) as Client[]);
    setLoading(false);
  }

  function updateField<K extends keyof DashboardFormData>(
    field: K,
    value: DashboardFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingId(null);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const companyName = formData.company_name.trim();
    const phoneNumber = formData.phone_number.trim();
    const requirements = formData.requirements.trim();

    if (!companyName || !phoneNumber) {
      setErrorMessage("Company name and phone number are required.");
      return;
    }

    if (formData.interested && !requirements) {
      setErrorMessage(
        "Add the project requirements for an interested client.",
      );
      return;
    }

    setSaving(true);

    const payload = {
      company_name: companyName,
      contact_person: formData.contact_person.trim() || null,
      phone_number: phoneNumber,
      called: formData.called,
      interested: formData.interested,
      requirements: formData.interested ? requirements : null,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("clients").insert(payload);

    setSaving(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    setSuccessMessage(
      editingId
        ? "Client updated successfully."
        : "Client added successfully.",
    );

    setFormData(emptyForm);
    setEditingId(null);
    await loadClients();
  }

  function startEditing(client: Client) {
    setEditingId(client.id);

    setFormData({
      ...emptyForm,
      company_name: client.company_name,
      contact_person: client.contact_person ?? "",
      phone_number: client.phone_number,
      email: client.email ?? "",
      website: client.website ?? "",
      address: client.address ?? "",
      status: client.status ?? "New",
      priority: client.priority ?? "Medium",
      lead_source: client.lead_source ?? "",
      assigned_to: client.assigned_to ?? "",
      project_value:
        client.project_value != null ? String(client.project_value) : "",
      expected_close_date: client.expected_close_date ?? "",
      follow_up_date: client.follow_up_date ?? "",
      follow_up_time: client.follow_up_time ?? "",
      called: client.called,
      interested: client.interested,
      requirements: client.requirements ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteClient(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client?",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setClients((current) =>
      current.filter((client) => client.id !== id),
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredClients = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        client.company_name.toLowerCase().includes(searchTerm) ||
        client.phone_number.toLowerCase().includes(searchTerm) ||
        (client.contact_person ?? "")
          .toLowerCase()
          .includes(searchTerm) ||
        (client.requirements ?? "")
          .toLowerCase()
          .includes(searchTerm);

      const matchesFilter =
        filter === "all" ||
        (filter === "called" && client.called) ||
        (filter === "uncalled" && !client.called) ||
        (filter === "interested" && client.interested) ||
        (filter === "not-interested" && !client.interested);

      return matchesSearch && matchesFilter;
    });
  }, [clients, search, filter]);

  const statistics = useMemo(() => {
    return {
      total: clients.length,
      called: clients.filter((client) => client.called).length,
      interested: clients.filter((client) => client.interested).length,
      pending: clients.filter((client) => !client.called).length,
    };
  }, [clients]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Client management</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {email || "Loading..."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          Log out
        </button>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={statistics.total} />
        <StatCard label="Called" value={statistics.called} />
        <StatCard label="Interested" value={statistics.interested} />
        <StatCard label="Waiting to call" value={statistics.pending} />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {editingId ? "Edit client" : "Add potential client"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Store company details and update the result after calling.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <FormField label="Company name" htmlFor="company-name">
            <input
              id="company-name"
              type="text"
              required
              value={formData.company_name}
              onChange={(event) =>
                updateField("company_name", event.target.value)
              }
              placeholder="Example Company"
              className="input-field"
            />
          </FormField>

          <FormField label="Contact person" htmlFor="contact-person">
            <input
              id="contact-person"
              type="text"
              value={formData.contact_person}
              onChange={(event) =>
                updateField("contact_person", event.target.value)
              }
              placeholder="John Smith"
              className="input-field"
            />
          </FormField>

          <FormField label="Phone number" htmlFor="phone-number">
            <input
              id="phone-number"
              type="tel"
              required
              value={formData.phone_number}
              onChange={(event) =>
                updateField("phone_number", event.target.value)
              }
              placeholder="+389..."
              className="input-field"
            />
          </FormField>

          <div className="flex items-end gap-6 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.called}
                onChange={(event) =>
                  updateField("called", event.target.checked)
                }
                className="h-4 w-4"
              />
              Called
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.interested}
                onChange={(event) => {
                  const interested = event.target.checked;

                  setFormData((current) => ({
                    ...current,
                    interested,
                    requirements: interested
                      ? current.requirements
                      : "",
                  }));
                }}
                className="h-4 w-4"
              />
              Interested
            </label>
          </div>

          {formData.interested && (
            <div className="md:col-span-2">
              <FormField
                label="Project requirements"
                htmlFor="requirements"
              >
                <textarea
                  id="requirements"
                  rows={4}
                  value={formData.requirements}
                  onChange={(event) =>
                    updateField("requirements", event.target.value)
                  }
                  placeholder="Describe what the client requested..."
                  className="input-field resize-y"
                />
              </FormField>
            </div>
          )}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add client"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
          </div>

          {successMessage && (
            <p className="text-sm text-green-700 md:col-span-2">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
              {errorMessage}
            </p>
          )}
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Clients
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredClients.length} of {clients.length} clients
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clients..."
              className="input-field sm:w-72"
            />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as
                    | "all"
                    | "called"
                    | "uncalled"
                    | "interested"
                    | "not-interested",
                )
              }
              className="input-field sm:w-48"
            >
              <option value="all">All clients</option>
              <option value="called">Called</option>
              <option value="uncalled">Not called</option>
              <option value="interested">Interested</option>
              <option value="not-interested">Not interested</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-500">
            Loading clients...
          </p>
        ) : filteredClients.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            No clients found.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-medium">Company</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Called</th>
                  <th className="px-3 py-3 font-medium">Interested</th>
                  <th className="px-3 py-3 font-medium">
                    Requirements
                  </th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="px-3 py-4 font-medium text-slate-950">
                      {client.company_name}
                    </td>

                    <td className="px-3 py-4 text-slate-600">
                      {client.contact_person || "—"}
                    </td>

                    <td className="px-3 py-4">
                      <a
                        href={`tel:${client.phone_number}`}
                        className="text-slate-700 hover:underline"
                      >
                        {client.phone_number}
                      </a>
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge value={client.called} />
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge value={client.interested} />
                    </td>

                    <td className="max-w-sm whitespace-pre-wrap px-3 py-4 text-slate-600">
                      {client.requirements || "—"}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(client)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteClient(client.id)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function StatusBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      No
    </span>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      {children}
    </div>
  );
}