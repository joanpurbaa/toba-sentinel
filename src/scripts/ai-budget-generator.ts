// scripts/ai-budget-generator.ts
// One-off: compute urgency score per WISATA place that has AI issue data,
// count nearby HOTEL/RESTO within 2km (Haversine), upsert BudgetProposal.
// Run with: npx tsx scripts/ai-budget-generator.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, IssueCategory } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const RADIUS_KM = 2.0;
const DEFAULT_RATING = 4.4; // dataset average, used as neutral fallback when rating is null

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

async function main() {
	const wisataPlaces = await prisma.place.findMany({
		where: {
			category: "WISATA",
			latitude: { not: null },
			longitude: { not: null },
		},
		select: {
			id: true,
			name: true,
			rating: true,
			latitude: true,
			longitude: true,
			issueSummaries: {
				where: { totalMentions: { gt: 0 } },
				select: {
					category: true,
					gapScore: true,
					negativeCount: true,
					totalMentions: true,
				},
			},
		},
	});

	const umkmPlaces = await prisma.place.findMany({
		where: {
			category: { in: ["HOTEL", "RESTO"] },
			latitude: { not: null },
			longitude: { not: null },
		},
		select: { id: true, latitude: true, longitude: true },
	});

	console.log(
		`Found ${wisataPlaces.length} WISATA places, ${umkmPlaces.length} HOTEL/RESTO candidates.`,
	);

	let created = 0;

	for (const place of wisataPlaces) {
		if (place.issueSummaries.length === 0) continue;

		const worst = [...place.issueSummaries].sort(
			(a, b) => b.gapScore - a.gapScore,
		)[0];
		const totalMentions = place.issueSummaries.reduce(
			(sum, s) => sum + s.totalMentions,
			0,
		);
		const rating = place.rating ?? DEFAULT_RATING;

		const urgencyScore =
			worst.gapScore * (1 + totalMentions / 100) * (6 - rating);

		const affectedUmkmCount = umkmPlaces.filter(
			(u) =>
				haversineKm(place.latitude!, place.longitude!, u.latitude!, u.longitude!) <=
				RADIUS_KM,
		).length;

		await prisma.budgetProposal.upsert({
			where: { placeId: place.id },
			update: {
				worstCategory: worst.category as IssueCategory,
				worstGapScore: worst.gapScore,
				urgencyScore,
				affectedUmkmCount,
			},
			create: {
				placeId: place.id,
				worstCategory: worst.category as IssueCategory,
				worstGapScore: worst.gapScore,
				urgencyScore,
				affectedUmkmCount,
			},
		});

		created++;
		console.log(
			`${place.name}: urgency=${urgencyScore.toFixed(2)}, worst=${worst.category} (${Math.round(worst.gapScore * 100)}%), umkm nearby=${affectedUmkmCount}`,
		);
	}

	console.log(`\nGenerated/updated ${created} budget proposals.`);
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	prisma.$disconnect();
	process.exit(1);
});
