import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { placeId, interventionType, budgetAmount } = body;

		if (!placeId) {
			return NextResponse.json(
				{ success: false, message: "Destinasi harus dipilih." },
				{ status: 400 },
			);
		}

		const place = await db.place.findUnique({
			where: { id: placeId },
			include: {
				issueSummaries: true,
				budgetProposal: true,
			},
		});

		if (!place) {
			return NextResponse.json(
				{ success: false, message: "Destinasi tidak ditemukan." },
				{ status: 404 },
			);
		}

		// Baseline Data
		const currentRating = place.rating ?? 3.8;
		const umkmCount =
			place.budgetProposal?.affectedUmkmCount ||
			Math.floor(Math.random() * 15) + 5;
		const currentBudget = Number(budgetAmount) || 200000000;

		const budgetFactor = Math.min(currentBudget / 500000000, 1.2);

		const ratingBoost = Number((0.3 + budgetFactor * 0.4).toFixed(1));
		const predictedRating = Math.min(
			4.9,
			Number((currentRating + ratingBoost).toFixed(1)),
		);

		const complaintReductionPct = Math.min(
			85,
			Math.round(30 + budgetFactor * 45),
		);

		const visitorGrowthPct = Math.min(40, Math.round(10 + budgetFactor * 20));

		const umkmRevenueGrowthPct = Math.min(35, Math.round(12 + budgetFactor * 18));

		const bpodtStatusAfter =
			currentBudget >= 100000000 ? "SINKRON" : "PERLU_TINJAUAN";

		return NextResponse.json({
			success: true,
			data: {
				place: {
					id: place.id,
					name: place.name,
					code: place.placeCode,
					category: place.category,
				},
				intervention: {
					type: interventionType,
					budget: currentBudget,
				},
				before: {
					rating: currentRating,
					complaintRatePct: 42,
					monthlyVisitorEst: 8500,
					bpodtVerified: place.bpodtVerified,
					affectedUmkm: umkmCount,
				},
				after: {
					rating: predictedRating,
					ratingDelta: `+${ratingBoost}`,
					complaintRatePct: Math.max(5, 42 - complaintReductionPct),
					complaintReductionPct: `-${complaintReductionPct}%`,
					monthlyVisitorEst: Math.round(8500 * (1 + visitorGrowthPct / 100)),
					visitorGrowthPct: `+${visitorGrowthPct}%`,
					umkmRevenueGrowthPct: `+${umkmRevenueGrowthPct}%`,
					bpodtVerified: bpodtStatusAfter,
				},
				summaryText: `Dengan pengucuran anggaran senilai Rp ${currentBudget.toLocaleString("id-ID")} untuk ${interventionType}, diprediksi rating destinasi meningkat dari ${currentRating} menjadi ${predictedRating}, serta berpotensi memulihkan traksi ekonomi ${umkmCount} UMKM di sekitarnya.`,
			},
		});
	} catch (error) {
		console.error("Error running simulator:", error);
		return NextResponse.json(
			{ success: false, message: "Gagal menjalankan simulasi." },
			{ status: 500 },
		);
	}
}
