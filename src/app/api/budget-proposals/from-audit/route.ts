import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const DEFAULT_RATING = 4.4;

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const { placeId } = body ?? {};

	if (!placeId) {
		return NextResponse.json({ error: "placeId wajib diisi." }, { status: 400 });
	}

	const place = await db.place.findUnique({
		where: { id: placeId },
		include: {
			issueSummaries: { where: { totalMentions: { gt: 0 } } },
		},
	});

	if (!place) {
		return NextResponse.json(
			{ error: "Tempat tidak ditemukan." },
			{ status: 404 },
		);
	}

	if (place.issueSummaries.length === 0) {
		return NextResponse.json(
			{
				error:
					"Belum ada data analisis AI untuk tempat ini, tidak bisa dihitung skor urgensinya.",
			},
			{ status: 400 },
		);
	}

	const worst = [...place.issueSummaries].sort(
		(a, b) => b.gapScore - a.gapScore,
	)[0];
	const totalMentions = place.issueSummaries.reduce(
		(sum, s) => sum + s.totalMentions,
		0,
	);
	const rating = place.rating ?? DEFAULT_RATING;
	const urgencyScore = worst.gapScore * (1 + totalMentions / 100) * (6 - rating);

	let affectedUmkmCount = 0;
	if (place.latitude !== null && place.longitude !== null) {
		const umkm = await db.place.findMany({
			where: {
				category: { in: ["HOTEL", "RESTO"] },
				latitude: { not: null },
				longitude: { not: null },
			},
			select: { latitude: true, longitude: true },
		});
		const R = 6371;
		affectedUmkmCount = umkm.filter((u) => {
			const dLat = ((u.latitude! - place.latitude!) * Math.PI) / 180;
			const dLon = ((u.longitude! - place.longitude!) * Math.PI) / 180;
			const a =
				Math.sin(dLat / 2) ** 2 +
				Math.cos((place.latitude! * Math.PI) / 180) *
					Math.cos((u.latitude! * Math.PI) / 180) *
					Math.sin(dLon / 2) ** 2;
			const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return dist <= 2.0;
		}).length;
	}

	const proposal = await db.budgetProposal.upsert({
		where: { placeId },
		update: {
			worstCategory: worst.category,
			worstGapScore: worst.gapScore,
			urgencyScore,
			affectedUmkmCount,
			status: "MENUNGGU",
		},
		create: {
			placeId,
			worstCategory: worst.category,
			worstGapScore: worst.gapScore,
			urgencyScore,
			affectedUmkmCount,
		},
	});

	const keys = await redis.keys("tobasentinel:budget-proposals:list:*");
	if (keys.length > 0) await redis.del(...keys);
	await redis.del("tobasentinel:dashboard:overview");

	return NextResponse.json(proposal, { status: 201 });
}
