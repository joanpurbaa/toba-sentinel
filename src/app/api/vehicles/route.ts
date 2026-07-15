import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

function mapType(status: string) {
	if (status === "TERSEDIA") return "available";
	if (status === "PERAWATAN") return "maintenance";
	return "active";
}

function mapStatusLabel(status: string) {
	if (status === "TERSEDIA") return "Tersedia";
	if (status === "PERAWATAN") return "Perawatan";
	return "Digunakan";
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const cacheKey = `pharmasync:vehicles:page:${page}:pageSize:${pageSize}`;
	const cached = await redis.get(cacheKey);
	if (cached) {
		return NextResponse.json(cached);
	}

	const vehicles = await db.vehicle.findMany({
		include: { usualDriver: true },
		orderBy: { plateNumber: "asc" },
	});

	const mapped = vehicles.map((v) => ({
		id: v.id,
		plat: v.plateNumber,
		model: v.model,
		jenis: v.vehicleType,
		sopir: v.usualDriver ? v.usualDriver.name : "-",
		status: mapStatusLabel(v.status),
		type: mapType(v.status),
	}));

	const totalItems = mapped.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * pageSize;
	const paginated = mapped.slice(start, start + pageSize);

	const payload = {
		vehicles: paginated,
		pagination: {
			page: safePage,
			pageSize,
			totalItems,
			totalPages,
		},
	};

	await redis.set(cacheKey, payload, { ex: 60 });

	return NextResponse.json(payload);
}

export async function POST(request: Request) {
	const body = await request.json();
	const { plateNumber, model, vehicleType, status, usualDriverId } = body;

	if (!plateNumber || !model || !vehicleType) {
		return NextResponse.json(
			{ error: "Field wajib belum lengkap" },
			{ status: 400 },
		);
	}

	const existing = await db.vehicle.findUnique({ where: { plateNumber } });
	if (existing) {
		return NextResponse.json(
			{ error: "Plat nomor sudah terdaftar" },
			{ status: 409 },
		);
	}

	const vehicle = await db.vehicle.create({
		data: {
			plateNumber,
			model,
			vehicleType,
			status: status || "TERSEDIA",
			usualDriverId: usualDriverId || null,
		},
	});

	const keys = await redis.keys("pharmasync:vehicles:page:*");
	if (keys.length) {
		await redis.del(...keys);
	}

	return NextResponse.json({ vehicle }, { status: 201 });
}
