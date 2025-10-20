import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("This function should only be called in the browser");
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = window.ENV?.SUPABASE_URL;
  const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseClient;
}
