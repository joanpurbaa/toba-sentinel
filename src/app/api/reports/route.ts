import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json().catch(() => null);
	const { status, responseNote, handledById } = body ?? {};

	if (!status) {
		return NextResponse.json({ error: "Status wajib diisi." }, { status: 400 });
	}

	const report = await db.report.update({
		where: { id },
		data: {
			status,
			responseNote: responseNote ?? undefined,
			handledById: handledById ?? undefined,
			respondedAt: new Date(),
		},
	});

	await redis.del("tobasentinel:dashboard:overview");
	await redis.del(`tobasentinel:place:${report.placeId}`);

	return NextResponse.json(report);
}
