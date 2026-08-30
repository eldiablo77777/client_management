import { useEffect, useMemo, useState } from "react";
import { LogOut, Plus, Search, Users } from "lucide-react";
import { useSession, logout } from "../lib/auth";
import { ToastProvider, useToast } from "../lib/toast";
import ToastViewport from "./ui/Toast";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import ClientModal from "./ClientModal";
import { deleteClient, fetchClients } from "../lib/queries";
import type { Client, SortOption } from "../types/client";

type FilterValue =
  | "all"
  | "interested"
  | "not-interested"
  | "landed"
  | "not-landed";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
      🟢 {activeLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
      ⚪ {inactiveLabel}
    </span>
  );
}

function DashboardContent() {
  const { session, loading: sessionLoading } = useSession();
  const { showToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function loadClients() {
    setLoading(true);
    try {
      setClients(await fetchClients());
    } catch (error) {
      console.error(error);
      showToast("error", "Could not load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = clients.filter((client) => {
      const matchesSearch =
        !term ||
        client.company_name.toLowerCase().includes(term) ||
        client.phone_number.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "interested" && client.interested) ||
        (filter === "not-interested" && !client.interested) ||
        (filter === "landed" && client.landed) ||
        (filter === "not-landed" && !client.landed);

      return matchesSearch && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "company_asc") {
        return a.company_name.localeCompare(b.company_name);
      }
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [clients, search, filter, sort]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      interested: clients.filter((client) => client.interested).length,
      landed: clients.filter((client) => client.landed).length,
    }),
    [clients],
  );

  function openAddModal() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
  }

  function handleSaved(client: Client) {
    setClients((current) => {
      const exists = current.some((item) => item.id === client.id);
      return exists
        ? current.map((item) => (item.id === client.id ? client : item))
        : [client, ...current];
    });
  }

  async function handleDelete() {
    if (!deletingClient) return;
    setDeleteBusy(true);

    try {
      await deleteClient(deletingClient.id);
      setClients((current) =>
        current.filter((item) => item.id !== deletingClient.id),
      );
      showToast("success", `${deletingClient.company_name} deleted.`);
      setDeletingClient(null);
    } catch (error) {
      console.error(error);
      showToast("error", "Could not delete client.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Client Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track potential clients and project opportunities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              {session.user.email}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total clients" value={stats.total} />
          <StatCard label="Interested" value={stats.interested} />
          <StatCard label="Landed" value={stats.landed} />
        </div>

        <div className="surface-card mt-6 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredClients.length} of {clients.length} clients
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
            >
              <Plus className="h-4 w-4" /> Add Client
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company or phone…"
                className="input-field pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as FilterValue)
                }
                className="input-field w-full sm:w-48"
                aria-label="Filter clients"
              >
                <option value="all">All</option>
                <option value="interested">Interested</option>
                <option value="not-interested">Not Interested</option>
                <option value="landed">Landed</option>
                <option value="not-landed">Not Landed</option>
              </select>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as SortOption)
                }
                className="input-field w-full sm:w-44"
                aria-label="Sort clients"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company_asc">Company A–Z</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">
                Loading clients…
              </p>
            ) : filteredClients.length === 0 ? (
              clients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No clients yet"
                  description="Add your first potential client to get started."
                  action={{ label: "Add Client", onClick: openAddModal }}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No clients match your search"
                  description="Try a different search term or filter."
                />
              )
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="px-3 py-3 font-medium">Company</th>
                        <th className="px-3 py-3 font-medium">Phone</th>
                        <th className="px-3 py-3 font-medium">Interested</th>
                        <th className="px-3 py-3 font-medium">Landed</th>
                        <th className="px-3 py-3 font-medium">
                          Requirements
                        </th>
                        <th className="px-3 py-3 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr
                          key={client.id}
                          className="border-b border-slate-100 align-top hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-900/40"
                        >
                          <td className="px-3 py-3.5">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {client.company_name}
                            </p>
                            {(client.contact_person || client.email) && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {[client.contact_person, client.email]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <a
                              href={`tel:${client.phone_number}`}
                              className="text-slate-600 hover:underline dark:text-slate-300"
                            >
                              {client.phone_number}
                            </a>
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill
                              active={client.interested}
                              activeLabel="Interested"
                              inactiveLabel="Not Interested"
                            />
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill
                              active={client.landed}
                              activeLabel="Landed"
                              inactiveLabel="Not Landed"
                            />
                          </td>
                          <td className="max-w-xs px-3 py-3.5 text-slate-600 dark:text-slate-300">
                            <p className="line-clamp-2 whitespace-pre-wrap">
                              {client.requirements || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="btn btn-secondary !px-3 !py-1.5 text-xs"
                                onClick={() => openEditModal(client)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger !px-3 !py-1.5 text-xs"
                                onClick={() => setDeletingClient(client)}
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

                <div className="space-y-3 md:hidden">
                  {filteredClients.map((client) => (
                    <div key={client.id} className="surface-card p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {client.company_name}
                        </p>
                        {(client.contact_person || client.email) && (
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {[client.contact_person, client.email]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      <a
                        href={`tel:${client.phone_number}`}
                        className="mt-2 inline-block text-sm text-slate-600 hover:underline dark:text-slate-300"
                      >
                        {client.phone_number}
                      </a>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <StatusPill
                          active={client.interested}
                          activeLabel="Interested"
                          inactiveLabel="Not Interested"
                        />
                        <StatusPill
                          active={client.landed}
                          activeLabel="Landed"
                          inactiveLabel="Not Landed"
                        />
                      </div>

                      {client.requirements && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                          {client.requirements}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary flex-1 text-xs"
                          onClick={() => openEditModal(client)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger flex-1 text-xs"
                          onClick={() => setDeletingClient(client)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ClientModal
        open={modalOpen}
        client={editingClient}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deletingClient !== null}
        title="Delete client"
        description={`Are you sure you want to delete ${deletingClient?.company_name ?? "this client"}? This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        loading={deleteBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingClient(null)}
      />

      <ToastViewport />
    </div>
  );
}

export default function DashboardApp() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
