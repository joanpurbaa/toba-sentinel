import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "tobasentinel:road-access:list";
const CACHE_TTL = 300;

export async function GET() {
	const cached = await redis.get(CACHE_KEY);
	if (cached) return NextResponse.json(cached);

	const routes = await db.roadAccessRoute.findMany({
		include: { place: { select: { id: true, name: true, placeCode: true } } },
	});

	const response = routes.map((r) => ({
		id: r.id,
		placeId: r.place.id,
		placeName: r.place.name,
		placeCode: r.place.placeCode,
		geometry: r.geometry,
		distanceKm: r.distanceKm,
		gapScore: r.gapScore,
		negativeCount: r.negativeCount,
		totalMentions: r.totalMentions,
	}));

	await redis.set(CACHE_KEY, response, { ex: CACHE_TTL });
	return NextResponse.json(response);
}
