import { db } from "@/lib/prisma";

export const actionLabelMap: Record<string, string> = {
	PENAMBAHAN: "Penambahan",
	DISTRIBUSI: "Distribusi",
	KOREKSI: "Koreksi",
	PENGURANGAN: "Pengurangan",
};

export const actionTypeMap: Record<
	string,
	"addition" | "distribution" | "correction" | "reduction"
> = {
	PENAMBAHAN: "addition",
	DISTRIBUSI: "distribution",
	KOREKSI: "correction",
	PENGURANGAN: "reduction",
};

export function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

export function formatDate(date: Date) {
	return date.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export function formatTime(date: Date) {
	return `${date.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	})} WIB`;
}

export function formatRelativeTime(date: Date) {
	const diffMs = Date.now() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	if (diffMinutes < 1) return "Baru saja";
	if (diffMinutes < 60) return `${diffMinutes}m yang lalu`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}j yang lalu`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays}h yang lalu`;
}

const movementInclude = {
	item: true,
	vendor: true,
	batch: true,
	performedBy: true,
} as const;

export async function getRecentStockMovementLogs(limit: number) {
	const movements = await db.stockMovement.findMany({
		orderBy: { createdAt: "desc" },
		take: limit,
		include: movementInclude,
	});

	return movements.map((movement) => {
		const targetDetail =
			movement.note ??
			(movement.vendor ? `Vendor: ${movement.vendor.name}` : null) ??
			(movement.batch ? `Batch: #${movement.batch.batchNumber}` : null) ??
			"";

		return {
			id: movement.id,
			createdAt: movement.createdAt,
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
}
