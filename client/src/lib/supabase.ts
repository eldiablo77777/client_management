import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eoaomelozzwkukwrrztf.supabase.co";
const supabaseKey = "sb_publishable_MMsRMegXGQdlNJvTDvipsQ_hzDe2Ruk".trim();

if (!supabaseUrl) {
  throw new Error("PUBLIC_SUPABASE_URL is missing.");
}

if (!supabaseKey) {
  throw new Error("PUBLIC_SUPABASE_ANON_KEY is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);