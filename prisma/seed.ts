import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create a test user
  const user = await prisma.user.upsert({
    where: { shop: "test-shop.myshopify.com" },
    update: {},
    create: {
      shop: "test-shop.myshopify.com",
      email: "test@example.com",
    },
  });

  console.log("Created user:", user.id);

  // Create warehouses
  const mainWarehouse = await prisma.warehouse.upsert({
    where: {
      id: "main-warehouse",
    },
    update: {},
    create: {
      id: "main-warehouse",
      name: "Main Warehouse",
      userId: user.id,
      isDefault: true,
    },
  });

  const secondWarehouse = await prisma.warehouse.upsert({
    where: {
      id: "second-warehouse",
    },
    update: {},
    create: {
      id: "second-warehouse",
      name: "Secondary Warehouse",
      userId: user.id,
      isDefault: false,
    },
  });

  console.log("Created warehouses");

  // Item 1: Blue Mops
  const blueMops = await prisma.item.upsert({
    where: {
      id: "item-blue-mops",
    },
    update: {},
    create: {
      id: "item-blue-mops",
      name: "Blue Mops",
      userId: user.id,
    },
  });

  // Blue Mops - Version 1
  const blueMopsV1 = await prisma.itemVersion.upsert({
    where: {
      itemId_version: {
        itemId: blueMops.id,
        version: 1,
      },
    },
    update: {},
    create: {
      itemId: blueMops.id,
      version: 1,
      unitPrice: 5.5,
      serviceCost: 0.3,
      taxCost: 0.5,
      deductibleTaxCost: 0.2,
      volume: 0.05,
      weight: 0.8,
      currency: "USD",
      supplier: "Cleaning Supplies Co",
      note: "Standard blue color",
    },
  });

  // Blue Mops - Version 2
  const blueMopsV2 = await prisma.itemVersion.upsert({
    where: {
      itemId_version: {
        itemId: blueMops.id,
        version: 2,
      },
    },
    update: {},
    create: {
      itemId: blueMops.id,
      version: 2,
      unitPrice: 6.2,
      serviceCost: 0.35,
      taxCost: 0.55,
      deductibleTaxCost: 0.25,
      volume: 0.05,
      weight: 0.8,
      currency: "USD",
      supplier: "Cleaning Supplies Co",
      note: "Premium blue color",
    },
  });

  // Blue Mops - Inventory for V1
  const blueMopsInvV1 = await prisma.inventoryItem.upsert({
    where: {
      itemId_itemVersionId_warehouseId: {
        itemId: blueMops.id,
        itemVersionId: blueMopsV1.id,
        warehouseId: mainWarehouse.id,
      },
    },
    update: {},
    create: {
      itemId: blueMops.id,
      itemVersionId: blueMopsV1.id,
      warehouseId: mainWarehouse.id,
      quantity: 100,
    },
  });

  // Blue Mops - Inventory for V2
  const blueMopsInvV2 = await prisma.inventoryItem.upsert({
    where: {
      itemId_itemVersionId_warehouseId: {
        itemId: blueMops.id,
        itemVersionId: blueMopsV2.id,
        warehouseId: mainWarehouse.id,
      },
    },
    update: {},
    create: {
      itemId: blueMops.id,
      itemVersionId: blueMopsV2.id,
      warehouseId: mainWarehouse.id,
      quantity: 50,
    },
  });

  // Blue Mops - History
  await prisma.inventoryHistory.createMany({
    data: [
      {
        inventoryItemId: blueMopsInvV1.id,
        quantity: 100,
        action: "ARRIVED",
        createdAt: new Date("2025-01-15"),
      },
      {
        inventoryItemId: blueMopsInvV2.id,
        quantity: 60,
        action: "ARRIVED",
        createdAt: new Date("2025-02-10"),
      },
      {
        inventoryItemId: blueMopsInvV2.id,
        quantity: 10,
        action: "MANUAL_DEDUCT",
        createdAt: new Date("2025-02-20"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Created Blue Mops with versions and inventory");

  // Item 2: Red Buckets
  const redBuckets = await prisma.item.upsert({
    where: {
      id: "item-red-buckets",
    },
    update: {},
    create: {
      id: "item-red-buckets",
      name: "Red Buckets",
      userId: user.id,
    },
  });

  // Red Buckets - Version 1
  const redBucketsV1 = await prisma.itemVersion.upsert({
    where: {
      itemId_version: {
        itemId: redBuckets.id,
        version: 1,
      },
    },
    update: {},
    create: {
      itemId: redBuckets.id,
      version: 1,
      unitPrice: 12.0,
      serviceCost: 0.8,
      taxCost: 1.2,
      deductibleTaxCost: 0.5,
      volume: 0.1,
      weight: 1.5,
      currency: "USD",
      supplier: "Bucket World Inc",
      note: "10L capacity",
    },
  });

  // Red Buckets - Version 2
  const redBucketsV2 = await prisma.itemVersion.upsert({
    where: {
      itemId_version: {
        itemId: redBuckets.id,
        version: 2,
      },
    },
    update: {},
    create: {
      itemId: redBuckets.id,
      version: 2,
      unitPrice: 11.5,
      serviceCost: 0.75,
      taxCost: 1.15,
      deductibleTaxCost: 0.48,
      volume: 0.1,
      weight: 1.5,
      currency: "USD",
      supplier: "Bucket World Inc",
      note: "10L capacity - improved design",
    },
  });

  // Red Buckets - Inventory for V1 (Main Warehouse)
  const redBucketsInvV1Main = await prisma.inventoryItem.upsert({
    where: {
      itemId_itemVersionId_warehouseId: {
        itemId: redBuckets.id,
        itemVersionId: redBucketsV1.id,
        warehouseId: mainWarehouse.id,
      },
    },
    update: {},
    create: {
      itemId: redBuckets.id,
      itemVersionId: redBucketsV1.id,
      warehouseId: mainWarehouse.id,
      quantity: 200,
    },
  });

  // Red Buckets - Inventory for V2 (Second Warehouse)
  const redBucketsInvV2Second = await prisma.inventoryItem.upsert({
    where: {
      itemId_itemVersionId_warehouseId: {
        itemId: redBuckets.id,
        itemVersionId: redBucketsV2.id,
        warehouseId: secondWarehouse.id,
      },
    },
    update: {},
    create: {
      itemId: redBuckets.id,
      itemVersionId: redBucketsV2.id,
      warehouseId: secondWarehouse.id,
      quantity: 75,
    },
  });

  // Red Buckets - History
  await prisma.inventoryHistory.createMany({
    data: [
      {
        inventoryItemId: redBucketsInvV1Main.id,
        quantity: 200,
        action: "ARRIVED",
        createdAt: new Date("2025-01-20"),
      },
      {
        inventoryItemId: redBucketsInvV2Second.id,
        quantity: 100,
        action: "ARRIVED",
        createdAt: new Date("2025-02-15"),
      },
      {
        inventoryItemId: redBucketsInvV2Second.id,
        quantity: 25,
        action: "WAREHOUSE_MOVE",
        fromWarehouseId: secondWarehouse.id,
        toWarehouseId: mainWarehouse.id,
        createdAt: new Date("2025-03-01"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Created Red Buckets with versions and inventory");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
