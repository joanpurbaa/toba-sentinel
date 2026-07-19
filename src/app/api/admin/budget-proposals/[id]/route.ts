import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

async function invalidateBudgetListCache() {
	const keys = await redis.keys("tobasentinel:budget-proposals:list:*");
	if (keys.length > 0) await redis.del(...keys);
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = await request.json().catch(() => null);
	const { status, approvedAmount, approvedById, notes } = body ?? {};

	if (!status) {
		return NextResponse.json({ error: "Status wajib diisi." }, { status: 400 });
	}

	const proposal = await db.budgetProposal.update({
		where: { id },
		data: {
			status,
			approvedAmount:
				approvedAmount !== undefined ? Number(approvedAmount) : undefined,
			approvedById: approvedById ?? undefined,
			notes: notes ?? undefined,
		},
	});

	await invalidateBudgetListCache();
	await redis.del("tobasentinel:dashboard:overview");
	await redis.del(`tobasentinel:place:${proposal.placeId}`);

	return NextResponse.json(proposal);
}
