import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("PUBLIC_SUPABASE_URL is missing.");
}

if (!supabaseKey) {
  throw new Error("PUBLIC_SUPABASE_ANON_KEY is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);