import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const LIST_CACHE_PREFIX = "tobasentinel:budget-proposals:list:";
const LIST_CACHE_TTL = 30;

const KABUPATEN_LIST = [
	"Toba",
	"Samosir",
	"Simalungun",
	"Dairi",
	"Humbang Hasundutan",
	"Tapanuli Utara",
	"Karo",
	"Pakpak Bharat",
];

function extractKabupaten(address: string | null): string {
	if (!address) return "Tidak Diketahui";
	for (const k of KABUPATEN_LIST) {
		if (address.toLowerCase().includes(k.toLowerCase())) return k;
	}
	return "Tidak Diketahui";
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const category = searchParams.get("category");
	const kabupaten = searchParams.get("kabupaten");
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify({ search, category, kabupaten, page, pageSize })}`;
	const cached = await redis.get(cacheKey);
	if (cached) {
		return NextResponse.json(cached);
	}

	const where: any = {
		AND: [
			search
				? { place: { name: { contains: search, mode: "insensitive" as const } } }
				: {},
			category && category !== "Semua Kategori" ? { worstCategory: category } : {},
			{ urgencyScore: { gt: 0 } },
		],
	};

	const allMatching = await db.budgetProposal.findMany({
		where,
		orderBy: { urgencyScore: "desc" },
		include: {
			place: { select: { id: true, name: true, placeCode: true, address: true } },
			approvedBy: { select: { id: true, name: true } },
		},
	});

	const withKabupaten = allMatching.map((p) => ({
		...p,
		kabupaten: extractKabupaten(p.place.address),
	}));

	const filtered =
		kabupaten && kabupaten !== "Semua Kabupaten"
			? withKabupaten.filter((p) => p.kabupaten === kabupaten)
			: withKabupaten;

	const maxUrgency = Math.max(...allMatching.map((p) => p.urgencyScore), 0.0001);

	const totalItems = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const start = (page - 1) * pageSize;
	const paginated = filtered.slice(start, start + pageSize);

	const response = {
		items: paginated,
		pagination: { page, pageSize, totalItems, totalPages },
		maxUrgency,
		availableKabupaten: [
			...new Set(withKabupaten.map((p) => p.kabupaten)),
		].sort(),
	};

	await redis.set(cacheKey, response, { ex: LIST_CACHE_TTL });

	return NextResponse.json(response);
}
