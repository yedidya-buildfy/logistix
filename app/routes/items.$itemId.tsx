import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Minus, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { formatNumber } from "../lib/utils";
import { prisma } from "../db.server";
import Sidebar from "../components/sidebar";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { itemId } = params;
  const url = new URL(request.url);
  const versionParam = url.searchParams.get("versions");
  const selectedVersions = versionParam ? versionParam.split(",") : [];

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      versions: {
        include: {
          inventoryItems: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: {
          version: "asc",
        },
      },
    },
  });

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  const warehouses = await prisma.warehouse.findMany({
    where: { userId: item.userId },
    orderBy: { name: "asc" },
  });

  const history = await prisma.inventoryHistory.findMany({
    where: {
      inventoryItem: {
        itemId: itemId,
      },
    },
    include: {
      inventoryItem: {
        include: {
          version: true,
          warehouse: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate stats
  let totalUnits = 0;
  let totalValue = 0;
  const warehouseDistribution: Record<string, { name: string; value: number }> = {};

  item.versions.forEach((version) => {
    const shouldInclude = selectedVersions.length === 0 || selectedVersions.includes(version.version.toString());

    if (shouldInclude) {
      version.inventoryItems.forEach((inv) => {
        totalUnits += inv.quantity;
        const unitCost =
          parseFloat(version.unitPrice.toString()) +
          parseFloat(version.serviceCost.toString()) +
          parseFloat(version.taxCost.toString()) -
          parseFloat(version.deductibleTaxCost.toString());
        const itemValue = inv.quantity * unitCost;
        totalValue += itemValue;

        if (!warehouseDistribution[inv.warehouse.id]) {
          warehouseDistribution[inv.warehouse.id] = {
            name: inv.warehouse.name,
            value: 0,
          };
        }
        warehouseDistribution[inv.warehouse.id].value += itemValue;
      });
    }
  });

  const warehouseChartData = Object.values(warehouseDistribution);

  return {
    item,
    warehouses,
    history,
    totalUnits,
    totalValue,
    warehouseChartData,
    selectedVersions,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { itemId } = params;
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "changeInventory") {
    const operation = formData.get("operation"); // "add" (adjust) or "set" (new absolute value)
    const quantity = parseInt(formData.get("quantity") as string);
    const versionId = formData.get("versionId") as string;
    const warehouseId = formData.get("warehouseId") as string;

    if (!quantity || !versionId || !warehouseId) {
      throw new Response("Missing required fields", { status: 400 });
    }

    // Find or create inventory item
    let inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        itemId_itemVersionId_warehouseId: {
          itemId: itemId!,
          itemVersionId: versionId,
          warehouseId: warehouseId,
        },
      },
    });

    let newQuantity: number;
    let historyAction: "MANUAL_ADD" | "MANUAL_DEDUCT";
    let historyQuantity: number;

    if (operation === "set") {
      // "New" field: Set absolute new quantity
      newQuantity = Math.max(0, quantity);
      const oldQuantity = inventoryItem?.quantity || 0;
      historyQuantity = Math.abs(newQuantity - oldQuantity);
      historyAction = newQuantity > oldQuantity ? "MANUAL_ADD" : "MANUAL_DEDUCT";
    } else {
      // "Adjust" field: Add or subtract from current
      const currentQuantity = inventoryItem?.quantity || 0;
      newQuantity = Math.max(0, currentQuantity + quantity);
      historyQuantity = Math.abs(quantity);
      historyAction = quantity > 0 ? "MANUAL_ADD" : "MANUAL_DEDUCT";
    }

    if (!inventoryItem) {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          itemId: itemId!,
          itemVersionId: versionId,
          warehouseId: warehouseId,
          quantity: newQuantity,
        },
      });
    } else {
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: newQuantity,
        },
      });
    }

    // Create history record
    await prisma.inventoryHistory.create({
      data: {
        inventoryItemId: inventoryItem.id,
        quantity: historyQuantity,
        action: historyAction,
      },
    });

    return { success: true };
  }

  return { success: false };
};

const COLORS = ["#ffffff", "#a3a3a3", "#737373", "#525252", "#404040"];

export default function ItemDetail() {
  const { item, warehouses, history, totalUnits, totalValue, warehouseChartData, selectedVersions } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const [isAdd, setIsAdd] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [versionCheckboxes, setVersionCheckboxes] = useState<string[]>(selectedVersions);

  // Get current quantity based on selected version and warehouse
  const getCurrentQuantity = () => {
    if (!selectedVersion || !selectedWarehouse) return 0;

    const version = item.versions.find((v) => v.id === selectedVersion);
    if (!version) return 0;

    const inventoryItem = version.inventoryItems.find(
      (inv) => inv.warehouseId === selectedWarehouse
    );

    return inventoryItem?.quantity || 0;
  };

  const currentQuantity = getCurrentQuantity();

  const getActionBadge = (action: string) => {
    switch (action) {
      case "ARRIVED":
        return <Badge variant="success">Arrived</Badge>;
      case "MANUAL_ADD":
        return <Badge variant="secondary">Manual Add</Badge>;
      case "MANUAL_DEDUCT":
        return <Badge variant="warning">Manual Deduct</Badge>;
      case "WAREHOUSE_MOVE":
        return <Badge variant="outline">Warehouse Move</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex group/sidebar">
      <Sidebar shop={shop || undefined} />
      <main className="flex-1 p-8 pl-6">
        <div className="mb-8">
          <Link to={`/items${shop ? `?shop=${shop}` : ""}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Items
            </Button>
          </Link>
          <h1 className="text-4xl font-normal text-white mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            {item.name}
          </h1>
        </div>

        {/* Version Filter */}
        <div className="mb-6">
          <Form method="get" className="flex items-center gap-4">
            <Label>Filter by Version:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[200px] justify-between"
                >
                  {versionCheckboxes.length === 0
                    ? "All Versions"
                    : `${versionCheckboxes.length} selected`}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3">
                <div className="space-y-2">
                  {item.versions.map((v) => (
                    <div key={v.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`version-${v.version}`}
                        checked={versionCheckboxes.includes(v.version.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVersionCheckboxes([...versionCheckboxes, v.version.toString()]);
                          } else {
                            setVersionCheckboxes(versionCheckboxes.filter((ver) => ver !== v.version.toString()));
                          }
                        }}
                      />
                      <label
                        htmlFor={`version-${v.version}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Version {v.version}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="versions" value={versionCheckboxes.join(",")} />
            <Button type="submit" variant="outline" size="sm">
              Apply
            </Button>
            {versionCheckboxes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVersionCheckboxes([])}
              >
                Clear
              </Button>
            )}
          </Form>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Units</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatNumber(totalUnits)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${formatNumber(totalValue)}</p>
            </CardContent>
          </Card>

          {warehouseChartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warehouse Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warehouseChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label
                      >
                        {warehouseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Change Inventory Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Change Inventory</CardTitle>
            <CardDescription>Adjust inventory quantities for this item</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="changeInventory" />
              <input type="hidden" name="operation" value={isAdd ? "add" : "set"} />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Adjust - adds/subtracts from current inventory */}
                <div>
                  <Label htmlFor="adjust" className="text-sm font-medium">Adjust</Label>
                  <Input
                    id="adjust"
                    type="number"
                    value={isAdd ? quantity : ""}
                    onChange={(e) => {
                      setIsAdd(true);
                      setQuantity(e.target.value);
                    }}
                    placeholder={currentQuantity.toString()}
                    className="mt-1"
                  />
                </div>

                {/* New - sets absolute new quantity */}
                <div>
                  <Label htmlFor="new" className="text-sm font-medium">New</Label>
                  <Input
                    id="new"
                    type="number"
                    min="0"
                    value={!isAdd ? quantity : ""}
                    onChange={(e) => {
                      setIsAdd(false);
                      setQuantity(e.target.value);
                    }}
                    placeholder={currentQuantity.toString()}
                    className="mt-1"
                  />
                </div>

                {/* Version Selection */}
                <div>
                  <Label htmlFor="versionId" className="text-sm font-medium">Version</Label>
                  <Select name="versionId" value={selectedVersion} onValueChange={setSelectedVersion} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {item.versions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          Version {v.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warehouse Selection */}
                <div>
                  <Label htmlFor="warehouseId" className="text-sm font-medium">Warehouse</Label>
                  <Select name="warehouseId" value={selectedWarehouse} onValueChange={setSelectedWarehouse} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <input type="hidden" name="quantity" value={quantity} />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" variant="outline" className="border-2 border-green-500/30 hover:bg-green-500/10">
                  Save Changes
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Version History Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>Version cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">+ Services</TableHead>
                  <TableHead className="text-right">+ Tax</TableHead>
                  <TableHead className="text-right">- Deductible Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>v{version.version}</TableCell>
                    <TableCell className="text-right">
                      ${formatNumber(version.unitPrice.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      ${formatNumber((parseFloat(version.unitPrice.toString()) + parseFloat(version.serviceCost.toString())).toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      ${formatNumber((parseFloat(version.unitPrice.toString()) + parseFloat(version.serviceCost.toString()) + parseFloat(version.taxCost.toString())).toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      ${formatNumber((parseFloat(version.unitPrice.toString()) + parseFloat(version.serviceCost.toString()) + parseFloat(version.taxCost.toString()) - parseFloat(version.deductibleTaxCost.toString())).toString())}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Full History */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory History</CardTitle>
            <CardDescription>Complete history of all inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-2 border-b border-neutral-800">
                <p className="text-sm text-gray-400">
                  Created on {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b border-neutral-800">
                  <div className="flex items-center gap-4">
                    {getActionBadge(record.action)}
                    <p className="text-sm">
                      <span className="font-medium">{record.quantity} units</span> of version {record.inventoryItem.version.version} - {record.inventoryItem.warehouse.name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
