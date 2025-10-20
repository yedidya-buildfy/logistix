import type { LoaderFunctionArgs } from "react-router";
import { json } from "react-router";
import { requireUser } from "../lib/auth.server";
import { login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await requireUser(request);

  if (!user.shop) {
    return json({ error: "No shop configured" }, { status: 400 });
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

  // If response is a redirect, extract the OAuth URL
  if (response instanceof Response && response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location");

    if (location) {
      // Set the cookie with user ID so OAuth callback can link the session
      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `shopify_oauth_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
      );

      return json(
        { authUrl: location },
        { headers }
      );
    }
  }

  return json({ error: "Failed to generate auth URL" }, { status: 500 });
};
