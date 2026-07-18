import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
	const [totalPlaces, byCategory] = await Promise.all([
		db.place.count(),
		db.place.groupBy({ by: ["category"], _count: { _all: true } }),
	]);

	const summary = {
		totalPlaces,
		totalWisata:
			byCategory.find((c) => c.category === "WISATA")?._count._all ?? 0,
		totalHotel: byCategory.find((c) => c.category === "HOTEL")?._count._all ?? 0,
		totalResto: byCategory.find((c) => c.category === "RESTO")?._count._all ?? 0,
	};

	return NextResponse.json(summary);
}
