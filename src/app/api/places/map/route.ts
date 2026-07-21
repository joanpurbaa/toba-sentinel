import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
	const places = await db.place.findMany({
		where: {
			latitude: { not: null },
			longitude: { not: null },
		},
		select: {
			id: true,
			placeCode: true,
			name: true,
			category: true,
			subtype: true,
			latitude: true,
			longitude: true,
			rating: true,
			address: true,
			bpodtVerified: true,
			issueSummaries: {
				where: { totalMentions: { gt: 0 } },
				select: {
					category: true,
					negativeCount: true,
					totalMentions: true,
					gapScore: true,
				},
			},
		},
	});

	const result = places.map((p) => {
		const totalMentions = p.issueSummaries.reduce(
			(sum, s) => sum + s.totalMentions,
			0,
		);
		const totalNegative = p.issueSummaries.reduce(
			(sum, s) => sum + s.negativeCount,
			0,
		);
		const worst =
			[...p.issueSummaries].sort((a, b) => b.gapScore - a.gapScore)[0] ?? null;

		return {
			id: p.id,
			placeCode: p.placeCode,
			name: p.name,
			category: p.category,
			subtype: p.subtype,
			latitude: p.latitude,
			longitude: p.longitude,
			rating: p.rating,
			address: p.address,
			bpodtVerified: p.bpodtVerified,
			aiGapScore: totalMentions > 0 ? totalNegative / totalMentions : null,
			aiTotalMentions: totalMentions,
			aiWorstCategory: worst?.category ?? null,
		};
	});

	return NextResponse.json(result);
}
