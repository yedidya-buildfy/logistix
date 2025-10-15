import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { formatNumber } from "../lib/utils";
import { prisma } from "../db.server";
import Sidebar from "../components/sidebar";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const items = await prisma.item.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {},
    include: {
      versions: {
        include: {
          inventoryItems: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const itemsWithStats = items.map((item) => {
    const totalUnits = item.versions.reduce((sum, version) => {
      return (
        sum +
        version.inventoryItems.reduce((vSum, inv) => vSum + inv.quantity, 0)
      );
    }, 0);

    const totalValue = item.versions.reduce((sum, version) => {
      const versionValue = version.inventoryItems.reduce((vSum, inv) => {
        const unitCost =
          parseFloat(version.unitPrice.toString()) +
          parseFloat(version.serviceCost.toString()) +
          parseFloat(version.taxCost.toString()) -
          parseFloat(version.deductibleTaxCost.toString());
        return vSum + inv.quantity * unitCost;
      }, 0);
      return sum + versionValue;
    }, 0);

    return {
      id: item.id,
      name: item.name,
      totalUnits,
      totalValue,
    };
  });

  return { items: itemsWithStats, search };
};

export default function ItemsIndex() {
  const { items, search } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar shop={shop || undefined} />
      <main className="flex-1 p-8 pl-6">
        <div className="mb-8">
          <h1 className="text-4xl font-normal text-white mb-2">Items</h1>
          <p className="text-gray-400 italic">Manage your inventory items and versions</p>
        </div>

          <div className="bg-neutral-900 rounded-lg shadow-sm border border-neutral-800 p-6">
            <div className="flex gap-4 mb-6">
              <form className="flex-1 flex gap-2" method="get">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    name="search"
                    placeholder="Search items..."
                    defaultValue={search}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
              <Link to="/items/new">
                <Button>Add Item</Button>
              </Link>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Total Units</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No items found. Add your first item to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.totalUnits)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${formatNumber(item.totalValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/items/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </main>
    </div>
  );
}
