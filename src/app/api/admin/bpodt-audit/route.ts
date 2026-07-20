import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import type { BpodtVerification, PlaceCategory } from "@prisma/client";

const CACHE_PREFIX = "tobasentinel:bpodt-audit:list:";
const CACHE_TTL = 30;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const category = searchParams.get("category");
	const bpodtStatus = searchParams.get("bpodtStatus");
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const cacheKey = `${CACHE_PREFIX}${JSON.stringify({
		search,
		category,
		bpodtStatus,
		page,
		pageSize,
	})}`;

	const cached = await redis.get(cacheKey);
	if (cached) {
		return NextResponse.json(cached);
	}

	const where: any = {
		AND: [
			search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" as const } },
							{ address: { contains: search, mode: "insensitive" as const } },
							{ placeCode: { contains: search, mode: "insensitive" as const } },
						],
					}
				: {},
			category && category !== "Semua Kategori"
				? { category: category as PlaceCategory }
				: {},
			bpodtStatus && bpodtStatus !== "Semua Status"
				? { bpodtVerified: bpodtStatus as BpodtVerification }
				: {},
		],
	};

	const totalItems = await db.place.count({ where });
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	const places = await db.place.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		skip: (page - 1) * pageSize,
		take: pageSize,
		include: {
			issueSummaries: {
				select: {
					negativeCount: true,
					totalMentions: true,
				},
			},
			_count: {
				select: {
					reviews: true,
				},
			},
		},
	});

	const [totalPlaces, sinkronCount, tidakSinkronCount, belumDicekCount] =
		await Promise.all([
			db.place.count(),
			db.place.count({ where: { bpodtVerified: "SINKRON" } }),
			db.place.count({ where: { bpodtVerified: "TIDAK_SINKRON" } }),
			db.place.count({ where: { bpodtVerified: "BELUM_DICEK" } }),
		]);

	const items = places.map((place) => {
		const issuesCount = place.issueSummaries.length;
		const negativeReviewsCount = place.issueSummaries.reduce(
			(acc, item) => acc + item.negativeCount,
			0,
		);

		return {
			id: place.id,
			placeCode: place.placeCode,
			name: place.name,
			category: place.category,
			address: place.address,
			latitude: place.latitude,
			longitude: place.longitude,
			rating: place.rating,
			operationalHour: place.operationalHour,
			bpodtVerified: place.bpodtVerified,
			bpodtNote: place.bpodtNote,
			updatedAt: place.updatedAt.toISOString(),
			issuesCount,
			negativeReviewsCount,
		};
	});

	const response = {
		items,
		pagination: { page, pageSize, totalItems, totalPages },
		summary: {
			totalPlaces,
			sinkronCount,
			tidakSinkronCount,
			belumDicekCount,
		},
	};

	await redis.set(cacheKey, response, { ex: CACHE_TTL });

	return NextResponse.json(response);
}

export async function PATCH(request: Request) {
	try {
		const body = await request.json();
		const { id, bpodtVerified, bpodtNote } = body;

		if (!id || !bpodtVerified) {
			return NextResponse.json(
				{ error: "ID dan status verifikasi wajib diisi" },
				{ status: 400 },
			);
		}

		const updatedPlace = await db.place.update({
			where: { id },
			data: {
				bpodtVerified,
				bpodtNote: bpodtNote ?? null,
			},
		});

		const keys = await redis.keys(`${CACHE_PREFIX}*`);
		if (keys.length > 0) {
			await redis.del(keys);
		}

		return NextResponse.json(updatedPlace);
	} catch {
		return NextResponse.json(
			{ error: "Gagal memperbarui status audit BPODT" },
			{ status: 500 },
		);
	}
}
