import { redirect } from "react-router";
import { getSupabaseUser } from "./supabase.server";
import { prisma } from "../db.server";
import type { User } from "@supabase/supabase-js";

export async function requireUser(request: Request) {
  const responseHeaders = new Headers();
  const supabaseUser = await getSupabaseUser(request, responseHeaders);

  if (!supabaseUser) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    // Build redirect URL with shop parameter at top level
    const redirectUrl = new URL("/auth", url.origin);
    redirectUrl.searchParams.set("redirect", url.pathname + url.search);
    if (shop) {
      redirectUrl.searchParams.set("shop", shop);
    }

    throw redirect(redirectUrl.pathname + redirectUrl.search, {
      headers: responseHeaders,
    });
  }

  // Sync user with database
  const dbUser = await syncUserToDatabase(supabaseUser);

  return { user: dbUser, headers: responseHeaders };
}

async function syncUserToDatabase(supabaseUser: User) {
  const shop = supabaseUser.user_metadata?.shop;

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: {
      email: supabaseUser.email!,
      firstName: supabaseUser.user_metadata?.first_name,
      lastName: supabaseUser.user_metadata?.last_name,
      ...(shop && { shop }), // Only update shop if it exists
      updatedAt: new Date(),
    },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      firstName: supabaseUser.user_metadata?.first_name,
      lastName: supabaseUser.user_metadata?.last_name,
      shop: shop || null,
    },
  });

  return user;
}
