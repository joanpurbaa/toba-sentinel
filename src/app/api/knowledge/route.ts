import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "tobasentinel:knowledge:list";
const CACHE_TTL = 300;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q") ?? "";

	const cacheKey = `${CACHE_KEY}:${query}`;
	const cached = await redis.get(cacheKey);
	if (cached) return NextResponse.json(cached);

	const articles = await db.knowledgeArticle.findMany({
		where: query
			? {
					OR: [
						{ title: { contains: query, mode: "insensitive" as const } },
						{ content: { contains: query, mode: "insensitive" as const } },
						{ kabupaten: { contains: query, mode: "insensitive" as const } },
					],
				}
			: undefined,
		orderBy: { title: "asc" },
	});

	await redis.set(cacheKey, articles, { ex: CACHE_TTL });
	return NextResponse.json(articles);
}
