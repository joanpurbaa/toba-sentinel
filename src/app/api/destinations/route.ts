import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";
import { invalidateMitraCache } from "@/lib/data/mitra";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const where = search
		? {
				OR: [
					{ name: { contains: search, mode: "insensitive" as const } },
					{ address: { contains: search, mode: "insensitive" as const } },
				],
			}
		: undefined;

	const [destinations, totalItems] = await Promise.all([
		db.destination.findMany({
			where,
			orderBy: { name: "asc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.destination.count({ where }),
	]);

	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	return NextResponse.json({
		destinations,
		pagination: { page, pageSize, totalItems, totalPages },
	});
}

export async function POST(request: Request) {
	const body = await request.json();
	const { name, address, phone, mapsLink } = body;

	if (!name || !mapsLink) {
		return NextResponse.json(
			{ error: "Nama klinik dan link Google Maps wajib diisi" },
			{ status: 400 },
		);
	}

	const coords = await parseGoogleMapsLink(mapsLink);

	if (!coords) {
		return NextResponse.json(
			{
				error:
					"Tidak bisa membaca koordinat dari link tersebut. Pastikan link berasal dari tombol Bagikan di Google Maps.",
			},
			{ status: 422 },
		);
	}

	const destination = await db.destination.create({
		data: {
			name,
			address: address || null,
			phone: phone || null,
			latitude: coords.latitude,
			longitude: coords.longitude,
		},
	});

	await invalidateMitraCache();

	return NextResponse.json({ destination }, { status: 201 });
}
