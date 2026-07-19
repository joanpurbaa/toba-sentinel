import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const DETAIL_CACHE_TTL = 30;

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const cacheKey = `tobasentinel:place:${id}`;

	const cached = await redis.get(cacheKey);
	if (cached) {
		return NextResponse.json(cached);
	}

	const place = await db.place.findUnique({
		where: { id },
		include: {
			issueSummaries: {
				where: { totalMentions: { gt: 0 } },
				orderBy: { gapScore: "desc" },
			},
			reports: {
				orderBy: { createdAt: "desc" },
				take: 10,
				select: {
					id: true,
					title: true,
					category: true,
					status: true,
					createdAt: true,
				},
			},
		},
	});

	if (!place) {
		return NextResponse.json(
			{ error: "Tempat tidak ditemukan." },
			{ status: 404 },
		);
	}

	const negativeSourceReviews = await db.review.findMany({
		where: {
			placeId: id,
			issueTags: { some: { isNegative: true } },
		},
		select: {
			id: true,
			reviewerName: true,
			reviewerRating: true,
			reviewText: true,
			publishedAtRaw: true,
			issueTags: {
				where: { isNegative: true },
				select: { category: true, confidence: true },
			},
		},
		orderBy: { scrapedAtDate: "desc" },
		take: 15,
	});

	const excludeIds = negativeSourceReviews.map((r) => r.id);

	const otherReviews = await db.review.findMany({
		where: {
			placeId: id,
			id: { notIn: excludeIds },
		},
		orderBy: { scrapedAtDate: "desc" },
		take: Math.max(0, 20 - negativeSourceReviews.length),
		select: {
			id: true,
			reviewerName: true,
			reviewerRating: true,
			reviewText: true,
			publishedAtRaw: true,
		},
	});

	const reviews = [
		...negativeSourceReviews.map((r) => ({ ...r, isNegativeSource: true })),
		...otherReviews.map((r) => ({
			...r,
			isNegativeSource: false,
			issueTags: [],
		})),
	];

	const response = { ...place, reviews };

	await redis.set(cacheKey, response, { ex: DETAIL_CACHE_TTL });

	return NextResponse.json(response);
}
