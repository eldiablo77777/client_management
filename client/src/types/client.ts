export const CLIENT_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Negotiating",
  "Won",
  "Lost",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type ClientPriority = (typeof CLIENT_PRIORITIES)[number];

export const ACTIVITY_TYPES = [
  "created",
  "call",
  "email",
  "meeting",
  "note",
  "status_change",
  "follow_up",
  "archived",
  "restored",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const CALL_RESULTS = [
  "No answer",
  "Interested",
  "Not interested",
  "Call back later",
  "Requested quote",
  "Won",
] as const;

export type CallResult = (typeof CALL_RESULTS)[number];

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_person: string | null;
  phone_number: string;
  email: string | null;
  website: string | null;
  address: string | null;
  status: ClientStatus;
  priority: ClientPriority;
  lead_source: string | null;
  assigned_to: string | null;
  project_value: number | null;
  expected_close_date: string | null;
  follow_up_date: string | null;
  follow_up_time: string | null;
  requirements: string | null;
  archived: boolean;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
  // Legacy columns, kept for historical data. The app no longer writes
  // these — `status` is the source of truth going forward.
  called: boolean;
  interested: boolean;
};

export type ClientFormData = {
  company_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  website: string;
  address: string;
  status: ClientStatus;
  priority: ClientPriority;
  lead_source: string;
  assigned_to: string;
  project_value: string;
  expected_close_date: string;
  follow_up_date: string;
  follow_up_time: string;
  requirements: string;
};

export type ClientActivity = {
  id: string;
  client_id: string;
  user_id: string | null;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type FollowUp = {
  id: string;
  client_id: string;
  user_id: string | null;
  scheduled_at: string;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type FollowUpWithClient = FollowUp & {
  client: Pick<Client, "id" | "company_name" | "contact_person"> | null;
};
