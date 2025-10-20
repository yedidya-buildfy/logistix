import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser } from "../lib/auth.server";
import { login } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await requireUser(request);

  if (!user.shop) {
    return redirect("/dashboard?error=no-shop");
  }

  // Create a form data with the shop parameter
  const formData = new FormData();
  formData.append("shop", user.shop);

  // Create a new request with the shop parameter
  const loginRequest = new Request(request.url, {
    method: "POST",
    body: formData,
  });

  // Store user ID in cookie for the OAuth callback
  const response = await login(loginRequest);

  // If response is a redirect, add the user ID to it
  if (response instanceof Response && response.status >= 300 && response.status < 400) {
    const headers = new Headers(response.headers);

    // Store the Supabase user ID in a cookie that will be available after OAuth
    headers.append(
      "Set-Cookie",
      `shopify_oauth_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
};
