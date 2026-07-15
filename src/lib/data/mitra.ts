import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const MITRA_CACHE_KEY = "pharmasync:snapshot:mitra";
const MITRA_CACHE_TTL = 60 * 60;

export interface MitraSnapshot {
	id: string;
	name: string;
	address: string | null;
	phone: string | null;
}

async function fetchMitraFromDb(): Promise<MitraSnapshot[]> {
	const destinations = await db.destination.findMany({
		orderBy: { name: "asc" },
	});
	return destinations.map((d) => ({
		id: d.id,
		name: d.name,
		address: d.address,
		phone: d.phone,
	}));
}

export async function getAllMitraCached(): Promise<MitraSnapshot[]> {
	try {
		const cached = await redis.get<MitraSnapshot[]>(MITRA_CACHE_KEY);
		if (cached) return cached;
	} catch (err) {
		console.error("Gagal baca cache mitra:", err);
	}

	const mitra = await fetchMitraFromDb();

	try {
		await redis.set(MITRA_CACHE_KEY, mitra, { ex: MITRA_CACHE_TTL });
	} catch (err) {
		console.error("Gagal simpan cache mitra:", err);
	}

	return mitra;
}

export async function invalidateMitraCache() {
	try {
		await redis.del(MITRA_CACHE_KEY);
	} catch (err) {
		console.error("Gagal invalidate cache mitra:", err);
	}
}

export function filterMitra(list: MitraSnapshot[], search?: string) {
	if (!search) return list;
	return list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
}
