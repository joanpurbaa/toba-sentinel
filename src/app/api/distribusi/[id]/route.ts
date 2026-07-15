import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * GET /api/distribusi/[id]
 * Mengambil detail satu pengiriman
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const shipment = await db.shipment.findUnique({
		where: { id },
		include: {
			item: true,
			destination: true,
			driver: true,
			vehicle: true,
		},
	});

	if (!shipment) {
		return NextResponse.json(
			{ error: "Pengiriman tidak ditemukan" },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		id: shipment.id,
		code: shipment.code,
		item: shipment.item.name,
		quantity: shipment.quantity,
		destination: shipment.destination.name,
		scheduledAt: shipment.scheduledAt,
		driver: shipment.driver?.name ?? "-",
		vehicle: shipment.vehicle
			? `${shipment.vehicle.model} (${shipment.vehicle.plateNumber})`
			: "-",
		status: shipment.status,
	});
}

/**
 * PATCH /api/distribusi/[id]
 * Edit data pengiriman
 */
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json();

	const {
		itemId,
		quantity,
		destinationId,
		scheduledAt,
		driverId,
		vehicleId,
	} = body;

	if (!itemId || !quantity || !destinationId || !scheduledAt) {
		return NextResponse.json(
			{ error: "Field wajib belum lengkap" },
			{ status: 400 },
		);
	}

	const shipment = await db.shipment.update({
		where: { id },
		data: {
			itemId,
			quantity: Number(quantity),
			destinationId,
			scheduledAt: new Date(scheduledAt),
			driverId: driverId || null,
			vehicleId: vehicleId || null,
		},
	});

	return NextResponse.json({ shipment });
}

/**
 * DELETE /api/distribusi/[id]
 * Hapus pengiriman
 */
export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	await db.shipmentTrackingPoint.deleteMany({
		where: { shipmentId: id },
	});

	await db.stockMovement.updateMany({
		where: { shipmentId: id },
		data: {
			shipmentId: null,
		},
	});

	await db.shipment.delete({
		where: { id },
	});

	return NextResponse.json({
		success: true,
	});
}