import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "tobasentinel:dashboard:overview";
const CACHE_TTL_SECONDS = 30;

export async function GET() {
	const cachedData = await redis.get(CACHE_KEY);
	if (cachedData) {
		return NextResponse.json(cachedData);
	}

	const [
		totalPlaces,
		placesByCategory,
		taggedReviewCount,
		totalReviews,
		topGaps,
		reportsByStatus,
		recentReports,
	] = await Promise.all([
		db.place.count(),
		db.place.groupBy({ by: ["category"], _count: { _all: true } }),
		db.reviewIssueTag.groupBy({ by: ["reviewId"] }).then((r) => r.length),
		db.review.count(),
		db.placeIssueSummary.findMany({
			where: { totalMentions: { gt: 0 } },
			orderBy: { gapScore: "desc" },
			take: 5,
			include: { place: { select: { name: true, category: true } } },
		}),
		db.report.groupBy({ by: ["status"], _count: { _all: true } }),
		db.report.findMany({
			orderBy: { createdAt: "desc" },
			take: 6,
			include: {
				place: { select: { name: true } },
				filedBy: { select: { name: true } },
			},
		}),
	]);

	const response = {
		totalPlaces,
		placesByCategory: placesByCategory.map((p) => ({
			category: p.category,
			count: p._count._all,
		})),
		reviewCoverage: {
			total: totalReviews,
			tagged: taggedReviewCount,
		},
		topGapAreas: topGaps.map((g) => ({
			placeName: g.place.name,
			category: g.category,
			gapScore: Math.round(g.gapScore * 100),
			negativeCount: g.negativeCount,
			totalMentions: g.totalMentions,
		})),
		reportsByStatus: reportsByStatus.map((r) => ({
			status: r.status,
			count: r._count._all,
		})),
		recentReports: recentReports.map((r) => ({
			title: r.title,
			placeName: r.place.name,
			filedBy: r.filedBy.name,
			category: r.category,
			status: r.status,
			createdAt: r.createdAt,
		})),
	};

	await redis.set(CACHE_KEY, response, { ex: CACHE_TTL_SECONDS });

	return NextResponse.json(response);
}
