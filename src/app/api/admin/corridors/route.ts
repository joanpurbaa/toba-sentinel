import { NextResponse } from "next/server";
import { db } from "@/lib/prisma"; // Sesuaikan import db/prisma instance kamu

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const kabupaten = searchParams.get("kabupaten");
		const status = searchParams.get("status");

		const where: any = {};
		if (kabupaten && kabupaten !== "ALL") {
			where.kabupaten = kabupaten;
		}
		if (status && status !== "ALL") {
			where.status = status;
		}

		const corridors = await db.tourismCorridor.findMany({
			where,
			include: {
				place: {
					select: {
						id: true,
						name: true,
						placeCode: true,
						address: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ success: true, data: corridors });
	} catch (error) {
		console.error("Error fetching corridors:", error);
		return NextResponse.json(
			{ success: false, message: "Gagal mengambil data koridor wisata." },
			{ status: 500 },
		);
	}
}
