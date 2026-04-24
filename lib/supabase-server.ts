import { createClient } from "@supabase/supabase-js";

// Server client — use in Server Components and API routes
// Uses service role key so it bypasses RLS where needed
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
