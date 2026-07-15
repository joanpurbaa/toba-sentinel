import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const batches = await db.itemBatch.findMany({
    where: {
      isActive: true,
      quantityRemaining: { gt: 0 },
    },
    include: {
      item: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { receivedAt: "asc" },
  });

  const result = batches.map((batch) => ({
    batchId: batch.id,
    itemId: batch.itemId,
    itemName: batch.item.name,
    category: batch.item.category.name,
    description: batch.item.description,
    quantityRemaining: batch.quantityRemaining,
    expiryDate: batch.expiryDate.toISOString(),
    receivedAt: batch.receivedAt.toISOString(),
  }));

  return NextResponse.json(result);
}