import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useSession } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import {
  archiveClient,
  deleteClientPermanently,
  fetchClients,
  fetchProfiles,
  restoreClient,
  updateClientStatus,
} from "../../lib/queries";
import type { Client, ClientStatus, Profile } from "../../types/client";
import { applyClientFilters, defaultFilters, type ClientFilters } from "./clientFilters";
import ClientFilterBar from "./ClientFilterBar";
import ClientTable from "./ClientTable";
import ClientCard from "./ClientCard";
import ClientModal from "./ClientModal";
import ClientDetails from "./ClientDetails";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";

type ConfirmAction =
  | { kind: "archive"; client: Client }
  | { kind: "restore"; client: Client }
  | { kind: "delete"; client: Client }
  | null;

export default function ClientsPage({
  lockedStatus,
}: {
  lockedStatus?: ClientStatus;
}) {
  const { session } = useSession();
  const { showToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState<ClientFilters>(() => ({
    ...defaultFilters(),
    status: lockedStatus ?? "all",
  }));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function loadData(includeArchived: boolean) {
    setLoading(true);
    try {
      const [clientRows, profileRows] = await Promise.all([
        fetchClients(includeArchived),
        fetchProfiles(),
      ]);
      setClients(clientRows);
      setProfiles(profileRows);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    void loadData(showArchived);
  }, [session, showArchived]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId && clients.length > 0) {
      const match = clients.find((client) => client.id === openId);
      if (match) setViewingClient(match);
    }
  }, [clients]);

  const profilesById = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((profile) => map.set(profile.id, profile));
    return map;
  }, [profiles]);

  const filteredClients = useMemo(
    () => applyClientFilters(clients, filters),
    [clients, filters],
  );

  function openAddModal() {
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setModalOpen(true);
    setViewingClient(null);
  }

  function handleSaved(client: Client) {
    setClients((current) => {
      const exists = current.some((item) => item.id === client.id);
      return exists
        ? current.map((item) => (item.id === client.id ? client : item))
        : [client, ...current];
    });
  }

  async function handleStatusChange(client: Client, status: ClientStatus) {
    const previous = clients;
    setClients((current) =>
      current.map((item) => (item.id === client.id ? { ...item, status } : item)),
    );

    try {
      await updateClientStatus(client, status, session!.user.id);
    } catch (error) {
      setClients(previous);
      showToast("error", error instanceof Error ? error.message : "Could not update status.");
    }
  }

  async function handleConfirm() {
    if (!confirmAction || !session) return;
    setConfirmBusy(true);

    try {
      if (confirmAction.kind === "archive") {
        await archiveClient(confirmAction.client, session.user.id);
        setClients((current) => current.filter((item) => item.id !== confirmAction.client.id));
        showToast("success", `${confirmAction.client.company_name} archived.`);
      } else if (confirmAction.kind === "restore") {
        await restoreClient(confirmAction.client, session.user.id);
        setClients((current) => current.filter((item) => item.id !== confirmAction.client.id));
        showToast("success", `${confirmAction.client.company_name} restored.`);
      } else if (confirmAction.kind === "delete") {
        await deleteClientPermanently(confirmAction.client.id);
        setClients((current) => current.filter((item) => item.id !== confirmAction.client.id));
        showToast("success", `${confirmAction.client.company_name} deleted permanently.`);
      }
      setConfirmAction(null);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Action failed.");
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="surface-card p-5">
        <ClientFilterBar
          filters={filters}
          onChange={setFilters}
          profiles={profiles}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((current) => !current)}
          onAddClient={openAddModal}
          resultCount={filteredClients.length}
          totalCount={clients.length}
          hideStatusFilter={Boolean(lockedStatus)}
        />

        <div className="mt-5">
          {!loading && filteredClients.length === 0 ? (
            clients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No clients yet"
                description="Add your first client to start building your pipeline."
                action={showArchived ? undefined : { label: "Add client", onClick: openAddModal }}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No clients match your search"
                description="Try adjusting your filters or search term."
              />
            )
          ) : (
            <>
              <ClientTable
                clients={filteredClients}
                profilesById={profilesById}
                loading={loading}
                showArchived={showArchived}
                onView={setViewingClient}
                onEdit={openEditModal}
                onArchive={(client) => setConfirmAction({ kind: "archive", client })}
                onRestore={(client) => setConfirmAction({ kind: "restore", client })}
                onDelete={(client) => setConfirmAction({ kind: "delete", client })}
                onStatusChange={(client, status) => void handleStatusChange(client, status)}
              />
              <ClientCard
                clients={filteredClients}
                profilesById={profilesById}
                loading={loading}
                showArchived={showArchived}
                onView={setViewingClient}
                onEdit={openEditModal}
                onArchive={(client) => setConfirmAction({ kind: "archive", client })}
                onRestore={(client) => setConfirmAction({ kind: "restore", client })}
                onDelete={(client) => setConfirmAction({ kind: "delete", client })}
              />
            </>
          )}
        </div>
      </div>

      {session && (
        <ClientModal
          open={modalOpen}
          client={editingClient}
          profiles={profiles}
          userId={session.user.id}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {viewingClient && session && (
        <ClientDetails
          client={viewingClient}
          profiles={profiles}
          userId={session.user.id}
          onClose={() => setViewingClient(null)}
          onEdit={() => openEditModal(viewingClient)}
          onActivityLogged={() => void loadData(showArchived)}
        />
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.kind === "archive"
            ? "Archive client"
            : confirmAction?.kind === "restore"
              ? "Restore client"
              : "Delete client permanently"
        }
        description={
          confirmAction?.kind === "archive"
            ? `Are you sure you want to archive ${confirmAction.client.company_name}? It will be hidden from the default client list.`
            : confirmAction?.kind === "restore"
              ? `Restore ${confirmAction.client.company_name} to your active client list?`
              : `This permanently deletes ${confirmAction?.client.company_name} and cannot be undone.`
        }
        confirmLabel={
          confirmAction?.kind === "archive"
            ? "Archive client"
            : confirmAction?.kind === "restore"
              ? "Restore client"
              : "Delete permanently"
        }
        tone={confirmAction?.kind === "delete" ? "danger" : "default"}
        loading={confirmBusy}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
