import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const { placeId } = body ?? {};

	if (!placeId) {
		return NextResponse.json({ error: "placeId wajib diisi." }, { status: 400 });
	}

	const place = await db.place.findUnique({ where: { id: placeId } });
	if (!place) {
		return NextResponse.json(
			{ error: "Tempat tidak ditemukan." },
			{ status: 404 },
		);
	}

	const pemerintah = await db.user.findFirst({ where: { role: "PEMERINTAH" } });
	if (!pemerintah) {
		return NextResponse.json(
			{ error: "Tidak ada akun pemerintah terdaftar." },
			{ status: 400 },
		);
	}

	const auditDetail = place.bpodtAuditDetail as any;
	const mismatchedFacility = auditDetail?.facilityChecks?.find(
		(f: any) => f.mismatch,
	);
	const category = mismatchedFacility?.category ?? "LAINNYA";

	const report = await db.report.create({
		data: {
			placeId,
			category,
			title: `Audit BPODT: ketidaksesuaian data resmi di ${place.name}`,
			description:
				place.bpodtNote ??
				"Ditemukan ketidaksesuaian antara data BPODT dan realita ulasan pengunjung.",
			status: "BARU",
			filedById: pemerintah.id,
		},
	});

	await redis.del("tobasentinel:dashboard:overview");
	await redis.del(`tobasentinel:place:${placeId}`);

	return NextResponse.json(report, { status: 201 });
}
