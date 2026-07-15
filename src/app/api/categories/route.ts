import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
	const cacheKey = "pharmasync:categories";

	const cachedData = await redis.get(cacheKey);
	if (cachedData) {
		return NextResponse.json(cachedData);
	}

	const categories = await db.category.findMany({
		orderBy: { name: "asc" },
	});

	const response = { categories };
	await redis.set(cacheKey, response, { ex: 3600 });

	return NextResponse.json(response);
}
