import { useSearchParams } from "react-router";
import Sidebar from "../components/sidebar";

export default function Warehouses() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar shop={shop || undefined} />
      <main className="flex-1 p-8 pl-6">
        <h1 className="text-5xl font-normal text-white">Warehouses</h1>
      </main>
    </div>
  );
}
