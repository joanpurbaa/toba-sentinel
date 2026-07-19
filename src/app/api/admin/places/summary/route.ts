import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "tobasentinel:places:summary";
const CACHE_TTL = 60;

export async function GET() {
	const cached = await redis.get(CACHE_KEY);
	if (cached) {
		return NextResponse.json(cached);
	}

	const [totalPlaces, byCategory] = await Promise.all([
		db.place.count(),
		db.place.groupBy({ by: ["category"], _count: { _all: true } }),
	]);

	const summary = {
		totalPlaces,
		totalWisata:
			byCategory.find((c) => c.category === "WISATA")?._count._all ?? 0,
		totalHotel: byCategory.find((c) => c.category === "HOTEL")?._count._all ?? 0,
		totalResto: byCategory.find((c) => c.category === "RESTO")?._count._all ?? 0,
	};

	await redis.set(CACHE_KEY, summary, { ex: CACHE_TTL });

	return NextResponse.json(summary);
}
