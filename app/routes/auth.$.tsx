import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Check if we have a user ID from the OAuth flow
  const cookieHeader = request.headers.get("Cookie");
  const userIdMatch = cookieHeader?.match(/shopify_oauth_user_id=([^;]+)/);
  const supabaseUserId = userIdMatch?.[1];

  // Link the Shopify session to the Supabase user if we have both
  if (session?.id && supabaseUserId) {
    await prisma.session.update({
      where: { id: session.id },
      data: { supabaseUserId },
    });

    // Also update the user's shop field if it's different
    await prisma.user.update({
      where: { id: supabaseUserId },
      data: { shop: session.shop },
    });
  }

  // After successful authentication, redirect to dashboard
  if (session?.shop) {
    // Create response with cookie deletion
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      "shopify_oauth_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );
    headers.append("Location", `/dashboard?shop=${session.shop}`);

    return new Response(null, {
      status: 302,
      headers,
    });
  }

  return redirect("/dashboard");
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
