export type Client = {
  id: string;
  company_name: string;
  phone_number: string;
  contact_person: string | null;
  email: string | null;
  interested: boolean;
  requirements: string | null;
  landed: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientFormData = {
  company_name: string;
  phone_number: string;
  contact_person: string;
  email: string;
  interested: boolean;
  requirements: string;
  landed: boolean;
};

export type SortOption = "newest" | "oldest" | "company_asc";
