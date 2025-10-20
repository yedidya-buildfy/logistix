import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import Sidebar from "../components/sidebar";
import { requireUser } from "../lib/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user, headers } = await requireUser(request);

  return { user };
};

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar user={user} />
      <main className="flex-1 p-8 pl-6">
        <h1 className="text-5xl font-normal text-white">Dashboard</h1>
      </main>
    </div>
  );
}
