import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const item = await db.item.findUnique({
		where: { id },
		include: {
			category: true,
			warehouse: true,
			batches: {
				orderBy: { expiryDate: "asc" },
				include: { vendor: true },
			},
		},
	});

	if (!item) {
		return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
	}

	return NextResponse.json({
		item: {
			id: item.id,
			name: item.name,
			description: item.description,
			sku: item.sku,
			category: item.category.name,
			unit: item.unit,
			currentStock: item.currentStock,
			minThreshold: item.minThreshold,
			criticalThreshold: item.criticalThreshold,
			expiryWarningDays: item.expiryWarningDays,
			storageCondition: item.storageCondition,
			registrationNumber: item.registrationNumber,
			isControlledSubstance: item.isControlledSubstance,
			warehouseName: item.warehouse.name,
			batches: item.batches.map((batch) => ({
				id: batch.id,
				batchNumber: batch.batchNumber,
				expiryDate: batch.expiryDate.toISOString(),
				quantityReceived: batch.quantityReceived,
				quantityRemaining: batch.quantityRemaining,
				vendorName: batch.vendor?.name ?? null,
				receivedAt: batch.receivedAt.toISOString(),
				isActive: batch.isActive,
			})),
		},
	});
}
