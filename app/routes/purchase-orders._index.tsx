import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import Sidebar from "../components/sidebar";
import { requireUser } from "../lib/auth.server";
import { getUserShopifySession } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user, headers } = await requireUser(request);
  const shopifySession = await getUserShopifySession(user.id, user.shop || undefined);

  return {
    user,
    shopifyConnected: !!shopifySession,
    shopifyShop: shopifySession?.shop || null,
  };
};

export default function PurchaseOrders() {
  const { user, shopifyConnected, shopifyShop } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar
        user={user}
        shopifyConnected={shopifyConnected}
        shopifyShop={shopifyShop}
      />
      <main className="flex-1 p-8 pl-6">
        <h1 className="text-5xl font-normal text-white">Purchase Orders</h1>
      </main>
    </div>
  );
}
