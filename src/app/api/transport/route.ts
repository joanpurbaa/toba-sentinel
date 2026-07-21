import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "tobasentinel:transport:list";
const CACHE_TTL = 300;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const routeType = searchParams.get("routeType");

	const cacheKey = `${CACHE_KEY}:${JSON.stringify({ search, routeType })}`;
	const cached = await redis.get(cacheKey);
	if (cached) return NextResponse.json(cached);

	const routes = await db.transportRoute.findMany({
		where: {
			AND: [
				routeType && routeType !== "ALL" ? { routeType: routeType as any } : {},
				search
					? {
							OR: [
								{ transportName: { contains: search, mode: "insensitive" as const } },
								{ routeCities: { has: search } },
							],
						}
					: {},
			],
		},
		orderBy: { transportName: "asc" },
	});

	await redis.set(cacheKey, routes, { ex: CACHE_TTL });
	return NextResponse.json(routes);
}
