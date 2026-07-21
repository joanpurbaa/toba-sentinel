import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		const place = await db.place.findUnique({
			where: { id },
			include: {
				issueSummaries: {
					select: {
						category: true,
						negativeCount: true,
						totalMentions: true,
						gapScore: true,
					},
				},
				reviews: {
					take: 5,
					orderBy: { createdAt: "desc" },
					select: {
						id: true,
						reviewerName: true,
						reviewerRating: true,
						reviewText: true,
						scrapedAtDate: true,
					},
				},
			},
		});

		if (!place) {
			return NextResponse.json(
				{ error: "Tempat tidak ditemukan" },
				{ status: 404 },
			);
		}

		const negativeReviewsCount = place.issueSummaries.reduce(
			(acc, item) => acc + item.negativeCount,
			0,
		);

		const detail = {
			id: place.id,
			placeCode: place.placeCode,
			name: place.name,
			category: place.category,
			address: place.address,
			latitude: place.latitude,
			longitude: place.longitude,
			rating: place.rating,
			operationalHour: place.operationalHour,
			facilitiesOrActivities: place.facilitiesOrActivities,
			description: place.description,
			ownerName: place.ownerName,
			priceRaw: place.priceRaw,
			bpodtVerified: place.bpodtVerified,
			bpodtNote: place.bpodtNote,
			updatedAt: place.updatedAt.toISOString(),
			issuesCount: place.issueSummaries.length,
			negativeReviewsCount,
			issueSummaries: place.issueSummaries.map((is) => ({
				category: is.category,
				negativeCount: is.negativeCount,
				totalMentions: is.totalMentions,
				gapScore: is.gapScore,
			})),
			recentReviews: place.reviews.map((rev) => ({
				id: rev.id,
				reviewerName: rev.reviewerName,
				reviewerRating: rev.reviewerRating,
				reviewText: rev.reviewText,
				scrapedAtDate: rev.scrapedAtDate ? rev.scrapedAtDate.toISOString() : null,
			})),
		};

		return NextResponse.json(detail);
	} catch {
		return NextResponse.json(
			{ error: "Gagal mengambil detail audit" },
			{ status: 500 },
		);
	}
}
