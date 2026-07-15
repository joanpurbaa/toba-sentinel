import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	const linkedShipments = await db.shipment.count({
		where: { destinationId: id },
	});

	if (linkedShipments > 0) {
		return NextResponse.json(
			{
				error: `Mitra ini masih dipakai di ${linkedShipments} pengiriman. Hapus atau ubah pengiriman terkait terlebih dahulu.`,
			},
			{ status: 409 },
		);
	}

	await db.destination.delete({ where: { id } });

	return NextResponse.json({ success: true });
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json();
	const { name, mapsLink, address, phone } = body;

	if (!name) {
		return NextResponse.json(
			{ error: "Nama mitra wajib diisi" },
			{ status: 400 },
		);
	}

	let coords: { latitude: number; longitude: number } | null = null;

	if (mapsLink) {
		coords = await parseGoogleMapsLink(mapsLink);
		if (!coords) {
			return NextResponse.json(
				{
					error:
						"Tidak bisa membaca koordinat dari link tersebut. Pastikan link berasal dari tombol Bagikan di Google Maps.",
				},
				{ status: 422 },
			);
		}
	}

	const destination = await db.destination.update({
		where: { id },
		data: {
			name,
			address: address || null,
			phone: phone || null,
			...(coords
				? { latitude: coords.latitude, longitude: coords.longitude }
				: {}),
		},
	});

	return NextResponse.json({ destination });
}