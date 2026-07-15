import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import {
	getRecentStockMovementLogs,
	formatRelativeTime,
} from "@/lib/stockMovements";

const CACHE_KEY = "pharmasync:dashboard:overview";
const CACHE_TTL_SECONDS = 30;

function getStockStatus(current: number, critical: number, min: number) {
	if (current <= critical) return "KRITIS";
	if (current <= min) return "MENIPIS";
	return "AMAN";
}

export async function GET() {
	const cachedData = await redis.get(CACHE_KEY);
	if (cachedData) {
		return NextResponse.json(cachedData);
	}

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const endOfToday = new Date();
	endOfToday.setHours(23, 59, 59, 999);

	const [totalItems, items, shipmentsToday, recentMovements] = await Promise.all(
		[
			db.item.count(),
			db.item.findMany({
				select: {
					id: true,
					name: true,
					sku: true,
					unit: true,
					currentStock: true,
					minThreshold: true,
					criticalThreshold: true,
					category: { select: { name: true } },
				},
			}),
			db.shipment.findMany({
				where: { scheduledAt: { gte: startOfToday, lte: endOfToday } },
				select: { status: true },
			}),
			getRecentStockMovementLogs(6),
		],
	);

	const itemsWithStatus = items
		.map((item) => ({
			...item,
			status: getStockStatus(
				item.currentStock,
				item.criticalThreshold,
				item.minThreshold,
			),
		}))
		.filter((item) => item.status !== "AMAN");

	const criticalStockCount = itemsWithStatus.filter(
		(item) => item.status === "KRITIS",
	).length;

	const criticalStockList = itemsWithStatus
		.sort(
			(a, b) =>
				(a.status === "KRITIS" ? -1 : 0) - (b.status === "KRITIS" ? -1 : 0),
		)
		.slice(0, 5)
		.map((item) => ({
			name: item.name,
			sku: item.sku,
			category: item.category.name,
			stock: `${item.currentStock} ${item.unit}`,
			status: item.status === "KRITIS" ? "Stok Kritis" : "Stok Menipis",
			type: item.status === "KRITIS" ? "kritis" : "menipis",
		}));

	const shipmentsCompleted = shipmentsToday.filter(
		(s) => s.status === "SELESAI",
	).length;
	const shipmentsInProgress = shipmentsToday.filter(
		(s) => s.status === "DIJADWALKAN" || s.status === "DIKIRIM",
	).length;

	const recentActivities = recentMovements.map((log, idx) => ({
		title: log.action,
		time: formatRelativeTime(log.createdAt),
		user: log.user,
		detail: log.targetDetail
			? `${log.targetItem} · ${log.targetDetail} (${log.change})`
			: `${log.targetItem} (${log.change})`,
		isLatest: idx === 0,
	}));

	const lastActivity = recentMovements[0]
		? formatRelativeTime(recentMovements[0].createdAt)
		: "-";

	const response = {
		totalItems,
		criticalStockCount,
		shipmentsToday: {
			total: shipmentsToday.length,
			completed: shipmentsCompleted,
			inProgress: shipmentsInProgress,
		},
		lastActivity,
		criticalStockList,
		recentActivities,
	};

	await redis.set(CACHE_KEY, response, { ex: CACHE_TTL_SECONDS });

	return NextResponse.json(response);
}
