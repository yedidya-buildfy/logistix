import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // After successful authentication, redirect to dashboard with shop parameter
  if (session?.shop) {
    return redirect(`/dashboard?shop=${session.shop}`);
  }

  return redirect("/dashboard");
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
