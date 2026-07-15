import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
	const [totalSopir, sopirAktif, totalKendaraan, dalamPerawatan] =
		await Promise.all([
			db.driver.count(),
			db.driver.count({ where: { status: "AKTIF" } }),
			db.vehicle.count(),
			db.vehicle.count({ where: { status: "PERAWATAN" } }),
		]);

	return NextResponse.json({
		totalSopir,
		sopirAktif,
		totalKendaraan,
		dalamPerawatan,
	});
}
