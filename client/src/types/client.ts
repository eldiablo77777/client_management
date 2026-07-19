export type Client = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone_number: string;
  called: boolean;
  interested: boolean;
  requirements: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientFormData = {
  company_name: string;
  contact_person: string;
  phone_number: string;
  called: boolean;
  interested: boolean;
  requirements: string;
};