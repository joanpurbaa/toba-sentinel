import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import {
	actionLabelMap,
	actionTypeMap,
	getInitials,
	formatDate,
	formatTime,
} from "@/lib/stockMovements";

function buildAuditLogsCacheKey(
	search: string,
	page: number,
	pageSize: number,
) {
	return `pharmasync:audit-logs:${encodeURIComponent(search || "all")}:${page}:${pageSize}`;
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search")?.trim() ?? "";
	const page = Math.max(Number(searchParams.get("page")) || 1, 1);
	const pageSize = Math.max(Number(searchParams.get("pageSize")) || 10, 1);

	const cacheKey = buildAuditLogsCacheKey(search, page, pageSize);
	const cachedData = await redis.get(cacheKey);
	if (cachedData) {
		return NextResponse.json(cachedData);
	}

	const where = search
		? {
				OR: [
					{ item: { name: { contains: search, mode: "insensitive" as const } } },
					{
						performedBy: {
							name: { contains: search, mode: "insensitive" as const },
						},
					},
					{ note: { contains: search, mode: "insensitive" as const } },
				],
			}
		: {};

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const endOfToday = new Date();
	endOfToday.setHours(23, 59, 59, 999);

	const [total, movements, todayCount, manualCorrections] = await Promise.all([
		db.stockMovement.count({ where }),
		db.stockMovement.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
			include: {
				item: true,
				vendor: true,
				batch: true,
				performedBy: true,
			},
		}),
		db.stockMovement.count({
			where: { createdAt: { gte: startOfToday, lte: endOfToday } },
		}),
		db.stockMovement.count({
			where: {
				type: "KOREKSI",
				createdAt: { gte: startOfToday, lte: endOfToday },
			},
		}),
	]);

	const logs = movements.map((movement) => {
		const targetDetail =
			movement.note ??
			(movement.vendor ? `Vendor: ${movement.vendor.name}` : null) ??
			(movement.batch ? `Batch: #${movement.batch.batchNumber}` : null) ??
			"";

		return {
			date: formatDate(movement.createdAt),
			time: formatTime(movement.createdAt),
			user: movement.performedBy.name,
			initials: getInitials(movement.performedBy.name),
			action: actionLabelMap[movement.type] ?? movement.type,
			actionType: actionTypeMap[movement.type] ?? "correction",
			targetItem: movement.item.name,
			targetDetail,
			change: `${movement.quantityChange > 0 ? "+" : ""}${movement.quantityChange} ${movement.item.unit}`,
			changeType: movement.quantityChange >= 0 ? "positive" : "negative",
			source: movement.sourceChannel === "WEB" ? "web" : "system",
		};
	});

	const response = {
		logs,
		total,
		page,
		pageSize,
		stats: {
			todayCount,
			manualCorrections,
		},
	};

	await redis.set(cacheKey, response, { ex: 60 });

	return NextResponse.json(response);
}
