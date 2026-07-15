import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const SHIPMENTS_CACHE_KEY = "pharmasync:snapshot:jadwal-pengiriman";
const SHIPMENTS_CACHE_TTL = 60 * 10;

export interface ShipmentSnapshot {
	id: string;
	code: string;
	itemName: string;
	quantity: number;
	unit: string;
	destinationName: string;
	scheduledAt: string;
	driverName: string | null;
	vehiclePlate: string | null;
	status: string;
}

async function fetchShipmentsFromDb(): Promise<ShipmentSnapshot[]> {
	const shipments = await db.shipment.findMany({
		include: { item: true, destination: true, driver: true, vehicle: true },
		orderBy: { scheduledAt: "desc" },
		take: 100,
	});

	return shipments.map((s) => ({
		id: s.id,
		code: s.code,
		itemName: s.item.name,
		quantity: s.quantity,
		unit: s.item.unit,
		destinationName: s.destination.name,
		scheduledAt: s.scheduledAt.toISOString(),
		driverName: s.driver ? s.driver.name : null,
		vehiclePlate: s.vehicle ? s.vehicle.plateNumber : null,
		status: s.status,
	}));
}

export async function getShipmentsCached(): Promise<ShipmentSnapshot[]> {
	try {
		const cached = await redis.get<ShipmentSnapshot[]>(SHIPMENTS_CACHE_KEY);
		if (cached) return cached;
	} catch (err) {
		console.error("Gagal baca cache jadwal pengiriman:", err);
	}

	const shipments = await fetchShipmentsFromDb();

	try {
		await redis.set(SHIPMENTS_CACHE_KEY, shipments, { ex: SHIPMENTS_CACHE_TTL });
	} catch (err) {
		console.error("Gagal simpan cache jadwal pengiriman:", err);
	}

	return shipments;
}

export async function invalidateShipmentsCache() {
	try {
		await redis.del(SHIPMENTS_CACHE_KEY);
	} catch (err) {
		console.error("Gagal invalidate cache jadwal pengiriman:", err);
	}
}

export function filterShipments(
	list: ShipmentSnapshot[],
	opts: { destinationSearch?: string; status?: string },
) {
	return list.filter((s) => {
		const matchDest = opts.destinationSearch
			? s.destinationName
					.toLowerCase()
					.includes(opts.destinationSearch.toLowerCase())
			: true;
		const matchStatus = opts.status
			? s.status === opts.status.toUpperCase()
			: true;
		return matchDest && matchStatus;
	});
}

export function buildShipmentSummaryText(list: ShipmentSnapshot[]): string {
	if (list.length === 0)
		return "Belum ada data pengiriman sama sekali di sistem.";

	const active = list.filter(
		(s) => s.status === "DIJADWALKAN" || s.status === "DIKIRIM",
	);
	const recentDone = list
		.filter((s) => s.status === "SELESAI" || s.status === "DIBATALKAN")
		.slice(0, 10);

	const formatLine = (s: ShipmentSnapshot) => {
		const date = new Date(s.scheduledAt).toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
		const time = new Date(s.scheduledAt).toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${s.code}: ${s.itemName} (${s.quantity} ${s.unit}) ke ${s.destinationName}, jadwal ${date} ${time}, status ${s.status}, driver ${s.driverName ?? "belum ditentukan"}.`;
	};

	const activeLine =
		active.length > 0
			? `Ada ${active.length} pengiriman aktif (dijadwalkan/dalam perjalanan):\n${active.map(formatLine).join("\n")}`
			: "Tidak ada pengiriman yang sedang dijadwalkan atau dalam perjalanan saat ini.";

	const doneLine =
		recentDone.length > 0
			? `\n\nRiwayat pengiriman terbaru (selesai/dibatalkan):\n${recentDone.map(formatLine).join("\n")}`
			: "";

	return `${activeLine}${doneLine}`;
}
