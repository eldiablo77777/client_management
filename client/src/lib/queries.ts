import { supabase } from "./supabase";
import type { Client, ClientFormData } from "../types/client";

const CLIENT_COLUMNS =
  "id, company_name, phone_number, contact_person, email, interested, requirements, landed, created_at, updated_at";

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function createClient(input: ClientFormData): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_name: input.company_name.trim(),
      phone_number: input.phone_number.trim(),
      contact_person: toNullable(input.contact_person),
      email: toNullable(input.email),
      interested: input.interested,
      requirements: toNullable(input.requirements),
      landed: input.landed,
    })
    .select(CLIENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  id: string,
  input: ClientFormData,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      company_name: input.company_name.trim(),
      phone_number: input.phone_number.trim(),
      contact_person: toNullable(input.contact_person),
      email: toNullable(input.email),
      interested: input.interested,
      requirements: toNullable(input.requirements),
      landed: input.landed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(CLIENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
