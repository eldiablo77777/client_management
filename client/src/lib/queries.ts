import { supabase } from "./supabase";
import type {
  Client,
  ClientActivity,
  ClientFormData,
  ClientStatus,
  FollowUpWithClient,
  Profile,
} from "../types/client";

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toClientRow(input: ClientFormData) {
  return {
    company_name: input.company_name.trim(),
    contact_person: toNullable(input.contact_person),
    phone_number: input.phone_number.trim(),
    email: toNullable(input.email),
    website: toNullable(input.website),
    address: toNullable(input.address),
    status: input.status,
    priority: input.priority,
    lead_source: toNullable(input.lead_source),
    assigned_to: toNullable(input.assigned_to),
    project_value: input.project_value.trim()
      ? Number(input.project_value)
      : null,
    expected_close_date: toNullable(input.expected_close_date),
    follow_up_date: toNullable(input.follow_up_date),
    follow_up_time: toNullable(input.follow_up_time),
    requirements: toNullable(input.requirements),
  };
}

export async function fetchClients(includeArchived = false): Promise<Client[]> {
  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClient(
  input: ClientFormData,
  userId: string,
): Promise<Client> {
  const row = {
    ...toClientRow(input),
    user_id: userId,
    called: false,
    interested: input.status === "Interested",
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;

  const client = data as Client;

  await addActivity(
    client.id,
    userId,
    "created",
    `${client.company_name} added to the pipeline`,
  );

  if (client.follow_up_date) {
    await createFollowUp(
      client.id,
      userId,
      combineDateTime(client.follow_up_date, client.follow_up_time)!,
      null,
      { skipClientSync: true },
    );
  }

  return client;
}

export async function updateClient(
  previous: Client,
  input: ClientFormData,
  userId: string,
): Promise<Client> {
  const row = {
    ...toClientRow(input),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("clients")
    .update(row)
    .eq("id", previous.id)
    .select("*")
    .single();

  if (error) throw error;

  const client = data as Client;

  if (previous.status !== client.status) {
    await addActivity(
      client.id,
      userId,
      "status_change",
      `Status changed to ${client.status}`,
    );
  }

  const previousFollowUp = combineDateTime(
    previous.follow_up_date,
    previous.follow_up_time,
  );
  const nextFollowUp = combineDateTime(
    client.follow_up_date,
    client.follow_up_time,
  );

  if (nextFollowUp && nextFollowUp !== previousFollowUp) {
    await createFollowUp(client.id, userId, nextFollowUp, null, {
      skipClientSync: true,
    });
  }

  return client;
}

export async function updateClientStatus(
  client: Client,
  status: ClientStatus,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", client.id);

  if (error) throw error;

  await addActivity(
    client.id,
    userId,
    "status_change",
    `Status changed to ${status}`,
  );
}

export async function archiveClient(
  client: Client,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", client.id);

  if (error) throw error;

  await addActivity(client.id, userId, "archived", "Client archived");
}

export async function restoreClient(
  client: Client,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ archived: false, updated_at: new Date().toISOString() })
    .eq("id", client.id);

  if (error) throw error;

  await addActivity(client.id, userId, "restored", "Client restored");
}

export async function deleteClientPermanently(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// --- Activities -------------------------------------------------------

export async function fetchActivities(
  clientId: string,
): Promise<ClientActivity[]> {
  const { data, error } = await supabase
    .from("client_activities")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClientActivity[];
}

export async function addActivity(
  clientId: string,
  userId: string | null,
  type: ClientActivity["type"],
  description: string,
  metadata: Record<string, unknown> | null = null,
): Promise<ClientActivity> {
  const { data, error } = await supabase
    .from("client_activities")
    .insert({
      client_id: clientId,
      user_id: userId,
      type,
      description,
      metadata,
    })
    .select("*")
    .single();

  if (error) throw error;

  if (type === "call" || type === "meeting") {
    await supabase
      .from("clients")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", clientId);
  }

  return data as ClientActivity;
}

export async function updateActivityNote(
  activityId: string,
  description: string,
): Promise<void> {
  const { error } = await supabase
    .from("client_activities")
    .update({ description })
    .eq("id", activityId);

  if (error) throw error;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("client_activities")
    .delete()
    .eq("id", activityId);

  if (error) throw error;
}

// --- Follow-ups ---------------------------------------------------------

export async function fetchFollowUps(): Promise<FollowUpWithClient[]> {
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*, client:clients(id, company_name, contact_person)")
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as FollowUpWithClient[];
}

function combineDateTime(
  date: string | null,
  time: string | null,
): string | null {
  if (!date) return null;
  return new Date(`${date}T${time ?? "09:00"}`).toISOString();
}

export async function createFollowUp(
  clientId: string,
  userId: string,
  scheduledAt: string,
  note: string | null,
  options: { skipClientSync?: boolean } = {},
): Promise<void> {
  const { error } = await supabase.from("follow_ups").insert({
    client_id: clientId,
    user_id: userId,
    scheduled_at: scheduledAt,
    note,
  });

  if (error) throw error;

  await addActivity(
    clientId,
    userId,
    "follow_up",
    `Follow-up scheduled for ${new Date(scheduledAt).toLocaleString()}`,
  );

  if (!options.skipClientSync) {
    await syncClientNextFollowUp(clientId);
  }
}

export async function completeFollowUp(
  followUp: FollowUpWithClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("follow_ups")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", followUp.id);

  if (error) throw error;

  await addActivity(
    followUp.client_id,
    userId,
    "follow_up",
    "Follow-up completed",
  );

  await syncClientNextFollowUp(followUp.client_id);
}

export async function rescheduleFollowUp(
  followUp: FollowUpWithClient,
  scheduledAt: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("follow_ups")
    .update({ scheduled_at: scheduledAt })
    .eq("id", followUp.id);

  if (error) throw error;

  await addActivity(
    followUp.client_id,
    userId,
    "follow_up",
    `Follow-up rescheduled to ${new Date(scheduledAt).toLocaleString()}`,
  );

  await syncClientNextFollowUp(followUp.client_id);
}

export async function deleteFollowUp(
  followUp: FollowUpWithClient,
): Promise<void> {
  const { error } = await supabase
    .from("follow_ups")
    .delete()
    .eq("id", followUp.id);

  if (error) throw error;

  await syncClientNextFollowUp(followUp.client_id);
}

async function syncClientNextFollowUp(clientId: string): Promise<void> {
  const { data, error } = await supabase
    .from("follow_ups")
    .select("scheduled_at")
    .eq("client_id", clientId)
    .eq("completed", false)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const next = data?.scheduled_at ? new Date(data.scheduled_at) : null;

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      follow_up_date: next ? next.toISOString().slice(0, 10) : null,
      follow_up_time: next ? next.toISOString().slice(11, 16) : null,
    })
    .eq("id", clientId);

  if (updateError) throw updateError;
}

// --- Profiles -------------------------------------------------------------

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("email", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}
