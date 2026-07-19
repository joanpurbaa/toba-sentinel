import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

async function invalidateAfterReportChange(placeId: string) {
	await redis.del("tobasentinel:dashboard:overview");
	await redis.del(`tobasentinel:place:${placeId}`);
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const status = searchParams.get("status");

	const reports = await db.report.findMany({
		where: status ? { status: status as any } : undefined,
		orderBy: { createdAt: "desc" },
		include: {
			place: { select: { id: true, name: true, category: true } },
			filedBy: { select: { id: true, name: true } },
			handledBy: { select: { id: true, name: true } },
		},
	});

	return NextResponse.json(reports);
}

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const { placeId, category, title, description, filedById } = body ?? {};

	if (!placeId || !category || !title || !description || !filedById) {
		return NextResponse.json(
			{ error: "Semua field wajib diisi." },
			{ status: 400 },
		);
	}

	const report = await db.report.create({
		data: { placeId, category, title, description, filedById },
	});

	await invalidateAfterReportChange(placeId);

	return NextResponse.json(report, { status: 201 });
}
