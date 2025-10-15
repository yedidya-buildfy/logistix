import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Redirect to dashboard
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If accessed from Shopify admin, redirect to dashboard
  if (shop) {
    const externalUrl = `${url.origin}/dashboard?shop=${shop}`;
    return redirect(externalUrl);
  }

  // If no shop param, redirect to dashboard
  return redirect("/dashboard");
};
