import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { parseGoogleMapsLink } from "@/lib/parseGoogleMapsLink";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const category = searchParams.get("category");
	const sort = searchParams.get("sort") ?? "terbaru";
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const where = {
		AND: [
			search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" as const } },
							{ placeCode: { contains: search, mode: "insensitive" as const } },
							{ address: { contains: search, mode: "insensitive" as const } },
						],
					}
				: {},
			category && category !== "Semua Kategori"
				? { category: category as any }
				: {},
		],
	};

	const places = await db.place.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		include: {
			issueSummaries: {
				where: { totalMentions: { gt: 0 } },
				select: { negativeCount: true, totalMentions: true },
			},
		},
	});

	const withGapScore = places.map((p) => {
		const totalMentions = p.issueSummaries.reduce(
			(sum, s) => sum + s.totalMentions,
			0,
		);
		const totalNegative = p.issueSummaries.reduce(
			(sum, s) => sum + s.negativeCount,
			0,
		);
		const { issueSummaries, ...rest } = p;
		return {
			...rest,
			aiGapScore: totalMentions > 0 ? totalNegative / totalMentions : null,
			aiTotalMentions: totalMentions,
		};
	});

	if (sort === "bermasalah") {
		withGapScore.sort((a, b) => (b.aiGapScore ?? -1) - (a.aiGapScore ?? -1));
	} else if (sort === "memuaskan") {
		withGapScore.sort((a, b) => {
			const av = a.aiGapScore ?? 2;
			const bv = b.aiGapScore ?? 2;
			return av - bv;
		});
	}

	const totalItems = withGapScore.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const start = (page - 1) * pageSize;
	const paginated = withGapScore.slice(start, start + pageSize);

	return NextResponse.json({
		items: paginated,
		pagination: { page, pageSize, totalItems, totalPages },
	});
}

export async function POST(request: Request) {
	const body = await request.json();
	const {
		name,
		category,
		subtype,
		priceMin,
		priceMax,
		mapsLink,
		address,
		operationalHour,
		facilitiesOrActivities,
		description,
		ownerName,
	} = body;

	if (!name || !category) {
		return NextResponse.json(
			{ error: "Nama dan kategori wajib diisi" },
			{ status: 400 },
		);
	}

	if (!mapsLink) {
		return NextResponse.json(
			{ error: "Link Google Maps wajib diisi" },
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

	const prefix =
		category === "WISATA" ? "WIS" : category === "HOTEL" ? "HTL" : "RES";

	async function nextPlaceCode(): Promise<string> {
		const last = await db.place.findMany({
			where: { category, placeCode: { startsWith: `${prefix}-` } },
			orderBy: { placeCode: "desc" },
			take: 1,
			select: { placeCode: true },
		});
		const lastNum = last[0]
			? parseInt(last[0].placeCode.split("-")[1], 10) || 0
			: 0;
		return `${prefix}-${String(lastNum + 1).padStart(3, "0")}`;
	}

	let place;
	for (let attempt = 0; attempt < 3; attempt++) {
		const placeCode = await nextPlaceCode();
		try {
			place = await db.place.create({
				data: {
					placeCode,
					name,
					category,
					subtype: subtype || null,
					priceMin:
						priceMin !== undefined && priceMin !== "" ? Number(priceMin) : null,
					priceMax:
						priceMax !== undefined && priceMax !== "" ? Number(priceMax) : null,
					latitude: coords.latitude,
					longitude: coords.longitude,
					address: address || null,
					operationalHour: operationalHour || null,
					facilitiesOrActivities: facilitiesOrActivities || null,
					description: description || null,
					ownerName: ownerName || null,
				},
			});
			break;
		} catch (err: any) {
			if (err?.code === "P2002" && attempt < 2) continue;
			throw err;
		}
	}

	return NextResponse.json({ place }, { status: 201 });
}

export async function PATCH(request: Request) {
	const body = await request.json();
	const { id, ...rest } = body;

	if (!id) {
		return NextResponse.json({ error: "ID wajib dikirim" }, { status: 400 });
	}

	const data: Record<string, any> = {};
	if (rest.name !== undefined) data.name = rest.name;
	if (rest.category !== undefined) data.category = rest.category;
	if (rest.subtype !== undefined) data.subtype = rest.subtype || null;
	if (rest.priceMin !== undefined)
		data.priceMin = rest.priceMin === "" ? null : Number(rest.priceMin);
	if (rest.priceMax !== undefined)
		data.priceMax = rest.priceMax === "" ? null : Number(rest.priceMax);
	if (rest.mapsLink) {
		const coords = await parseGoogleMapsLink(rest.mapsLink);
		if (!coords) {
			return NextResponse.json(
				{
					error:
						"Tidak bisa membaca koordinat dari link tersebut. Pastikan link berasal dari tombol Bagikan di Google Maps.",
				},
				{ status: 422 },
			);
		}
		data.latitude = coords.latitude;
		data.longitude = coords.longitude;
	}
	if (rest.address !== undefined) data.address = rest.address || null;
	if (rest.operationalHour !== undefined)
		data.operationalHour = rest.operationalHour || null;
	if (rest.facilitiesOrActivities !== undefined)
		data.facilitiesOrActivities = rest.facilitiesOrActivities || null;
	if (rest.description !== undefined)
		data.description = rest.description || null;
	if (rest.ownerName !== undefined) data.ownerName = rest.ownerName || null;

	const place = await db.place.update({ where: { id }, data });

	return NextResponse.json({ place });
}

export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return NextResponse.json({ error: "ID wajib dikirim" }, { status: 400 });
	}

	await db.place.delete({ where: { id } });

	return NextResponse.json({ message: "Tempat berhasil dihapus" });
}
