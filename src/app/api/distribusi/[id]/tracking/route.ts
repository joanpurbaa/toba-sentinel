import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const shipment = await db.shipment.findUnique({
		where: { id },
		include: {
			destination: true,
			trackingPoints: { orderBy: { recordedAt: "asc" } },
		},
	});

	if (!shipment) {
		return NextResponse.json(
			{ error: "Pengiriman tidak ditemukan" },
			{ status: 404 },
		);
	}

	return NextResponse.json({
		destination: {
			name: shipment.destination.name,
			address: shipment.destination.address,
			latitude: shipment.destination.latitude,
			longitude: shipment.destination.longitude,
		},
		route: shipment.trackingPoints.map((p) => ({
			latitude: p.latitude,
			longitude: p.longitude,
			recordedAt: p.recordedAt.toISOString(),
		})),
		status: shipment.status,
	});
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json();
	const { latitude, longitude } = body;

	if (typeof latitude !== "number" || typeof longitude !== "number") {
		return NextResponse.json({ error: "Koordinat tidak valid" }, { status: 400 });
	}

	const point = await db.shipmentTrackingPoint.create({
		data: { shipmentId: id, latitude, longitude },
	});

	return NextResponse.json({ point }, { status: 201 });
}
