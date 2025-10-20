import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export function createSupabaseServerClient(request: Request, responseHeaders: Headers) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          responseHeaders.append("Set-Cookie", serializeCookieHeader(name, value, options))
        );
      },
    },
  });
}

export async function getSupabaseUser(request: Request, responseHeaders: Headers) {
  const supabase = createSupabaseServerClient(request, responseHeaders);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth(request: Request, responseHeaders: Headers) {
  const user = await getSupabaseUser(request, responseHeaders);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return user;
}
