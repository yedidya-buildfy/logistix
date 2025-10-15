import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import Sidebar from "../components/sidebar";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  return { shop };
};

export default function Dashboard() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar shop={shop || undefined} />
      <main className="flex-1 p-8 pl-6">
        <h1 className="text-5xl font-normal text-white">Dashboard</h1>
      </main>
    </div>
  );
}
