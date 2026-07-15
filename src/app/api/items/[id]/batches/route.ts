import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

async function invalidateAuditLogsCache() {
	const cacheKeys = await redis.keys("pharmasync:audit-logs:*");
	if (cacheKeys.length > 0) {
		await redis.del(...cacheKeys);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json();
	const { batchNumber, expiryDate, quantityReceived, vendorName, note } = body;

	if (!batchNumber || !expiryDate || !quantityReceived) {
		return NextResponse.json(
			{ error: "Field wajib belum lengkap" },
			{ status: 400 },
		);
	}

	const item = await db.item.findUnique({ where: { id } });
	if (!item) {
		return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
	}

	const user = await db.user.findFirst({ where: { role: "ADMIN" } });
	if (!user) {
		return NextResponse.json(
			{ error: "Tidak ada user admin terdaftar" },
			{ status: 400 },
		);
	}

	const quantity = Number(quantityReceived);

	const result = await db.$transaction(async (tx) => {
		let vendor = null;
		if (vendorName) {
			vendor = await tx.vendor.upsert({
				where: { name: vendorName },
				update: {},
				create: { name: vendorName },
			});
		}

		const batch = await tx.itemBatch.create({
			data: {
				itemId: item.id,
				batchNumber,
				expiryDate: new Date(expiryDate),
				quantityReceived: quantity,
				quantityRemaining: quantity,
				vendorId: vendor?.id,
				receivedById: user.id,
			},
		});

		const updatedItem = await tx.item.update({
			where: { id: item.id },
			data: { currentStock: { increment: quantity } },
		});

		await tx.stockMovement.create({
			data: {
				itemId: item.id,
				batchId: batch.id,
				type: "PENAMBAHAN",
				quantityChange: quantity,
				stockBefore: item.currentStock,
				stockAfter: updatedItem.currentStock,
				vendorId: vendor?.id,
				note: note || null,
				performedById: user.id,
				sourceChannel: "WEB",
			},
		});

		await tx.auditLog.create({
			data: {
				userId: user.id,
				action: "RECEIVE_STOCK",
				entityType: "Item",
				entityId: item.id,
				detail: { batchNumber, quantity, vendorName },
				sourceChannel: "WEB",
			},
		});

		return { batch, item: updatedItem };
	});

	await redis.del("pharmasync:dashboard:overview");
	await invalidateAuditLogsCache();

	return NextResponse.json(result, { status: 201 });
}
