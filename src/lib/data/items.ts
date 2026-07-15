import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const ITEMS_CACHE_KEY = "pharmasync:snapshot:stok";
const ITEMS_CACHE_TTL = 60 * 60;

type StockStatus = "AMAN" | "MENIPIS" | "KRITIS" | "PENDING";

export interface ItemSnapshot {
	id: string;
	name: string;
	sku: string;
	category: string;
	quantity: number;
	unit: string;
	status: StockStatus;
	nearestExpiry: string | null;
}

function getStockStatus(
	current: number,
	critical: number,
	min: number,
): StockStatus {
	if (current <= critical) return "KRITIS";
	if (current <= min) return "MENIPIS";
	return "AMAN";
}

async function fetchItemsFromDb(): Promise<ItemSnapshot[]> {
	const items = await db.item.findMany({
		include: {
			category: true,
			batches: {
				where: { isActive: true, quantityRemaining: { gt: 0 } },
				orderBy: { expiryDate: "asc" },
			},
		},
		orderBy: { updatedAt: "desc" },
	});

	return items.map((item) => {
		const hasPendingSetup = item.currentStock === 0 && item.batches.length === 0;
		const status: StockStatus = hasPendingSetup
			? "PENDING"
			: getStockStatus(
					item.currentStock,
					item.criticalThreshold,
					item.minThreshold,
				);
		const nearestBatch = item.batches[0] ?? null;

		return {
			id: item.id,
			name: item.name,
			sku: item.sku,
			category: item.category.name,
			quantity: item.currentStock,
			unit: item.unit,
			status,
			nearestExpiry: nearestBatch ? nearestBatch.expiryDate.toISOString() : null,
		};
	});
}

export async function getAllItemsCached(): Promise<ItemSnapshot[]> {
	try {
		const cached = await redis.get<ItemSnapshot[]>(ITEMS_CACHE_KEY);
		if (cached) return cached;
	} catch (err) {
		console.error("Gagal baca cache items:", err);
	}

	const items = await fetchItemsFromDb();

	try {
		await redis.set(ITEMS_CACHE_KEY, items, { ex: ITEMS_CACHE_TTL });
	} catch (err) {
		console.error("Gagal simpan cache items:", err);
	}

	return items;
}

export async function invalidateItemsCache() {
	try {
		await redis.del(ITEMS_CACHE_KEY);
	} catch (err) {
		console.error("Gagal invalidate cache items:", err);
	}
}

export function filterItems(
	items: ItemSnapshot[],
	opts: { search?: string; status?: string },
) {
	return items.filter((item) => {
		const matchSearch = opts.search
			? item.name.toLowerCase().includes(opts.search.toLowerCase()) ||
				item.sku.toLowerCase().includes(opts.search.toLowerCase())
			: true;
		const matchStatus = opts.status
			? item.status === opts.status.toUpperCase()
			: true;
		return matchSearch && matchStatus;
	});
}

export function buildStockSummaryText(items: ItemSnapshot[]): string {
	if (items.length === 0) return "Data stok belum tersedia.";

	const counts: Record<string, number> = {};
	const kritis: string[] = [];
	const menipis: string[] = [];

	for (const item of items) {
		counts[item.status] = (counts[item.status] ?? 0) + 1;
		const label = `${item.name} (${item.quantity} ${item.unit})`;
		if (item.status === "KRITIS") kritis.push(label);
		if (item.status === "MENIPIS") menipis.push(label);
	}

	const totalLine = `Total ${items.length} item. Rincian status: ${Object.entries(
		counts,
	)
		.map(([s, c]) => `${s}=${c}`)
		.join(", ")}.`;
	const kritisLine =
		kritis.length > 0
			? `Item berstatus KRITIS: ${kritis.join(", ")}.`
			: "Tidak ada item berstatus KRITIS saat ini.";
	const menipisLine =
		menipis.length > 0
			? `Item berstatus MENIPIS: ${menipis.join(", ")}.`
			: "Tidak ada item berstatus MENIPIS saat ini.";

	return `${totalLine}\n${kritisLine}\n${menipisLine}`;
}
