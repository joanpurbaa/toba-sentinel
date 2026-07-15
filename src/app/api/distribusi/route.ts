import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { invalidateShipmentsCache } from "@/lib/data/shipments";

export const dynamic = "force-dynamic";

function decodeJWT(token: string) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
}

export async function GET(request: Request) {
	const cookieStore = await cookies();
	const token =
		cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

	if (!token) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const decoded = decodeJWT(token);
	if (!decoded) {
		return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
	}

	// ========================================================
	// FIX MATCHING KEY: Sesuaikan dengan isi payload asli lu!
	// ========================================================
	const currentUserRole = (decoded.role || "").toUpperCase();
	const currentDriverId = decoded.driverId; // Ambil langsung '5fd77535...' dari token

	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const baseWhere: any = {};

	if (search) {
		baseWhere.OR = [
			{ code: { contains: search, mode: "insensitive" } },
			{ item: { name: { contains: search, mode: "insensitive" } } },
		];
	}

	// ========================================================
	// LOGIKA FILTER STRICT ROLE (LEBIH SEDERHANA & CEPAT)
	// ========================================================
	if (currentUserRole === "ADMIN" || currentUserRole === "STAFF") {
		// Admin & Staff bisa melihat seluruh shipment
	} else if (currentUserRole === "DRIVER") {
		if (!currentDriverId) {
			return NextResponse.json(
				{ error: "Akses Ditolak: Akun driver Anda belum terhubung dengan benar." },
				{ status: 400 },
			);
		}
		// Langsung kunci shipment berdasarkan driverId yang ada di token!
		baseWhere.driverId = currentDriverId;
	} else {
		return NextResponse.json(
			{ error: "Akses Ditolak: Role tidak dikenali" },
			{ status: 403 },
		);
	}

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	// AMBIL DATA
	const [
		shipments,
		totalItems,
		scheduledCount,
		shippingCount,
		doneToday,
		activeDrivers,
		recentShipments,
	] = await Promise.all([
		db.shipment.findMany({
			where: baseWhere,
			include: { item: true, destination: true, driver: true, vehicle: true },
			orderBy: { scheduledAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
		}),
		db.shipment.count({ where: baseWhere }),
		db.shipment.count({ where: { ...baseWhere, status: "DIJADWALKAN" } }),
		db.shipment.count({ where: { ...baseWhere, status: "DIKIRIM" } }),
		db.shipment.count({
			where: { ...baseWhere, status: "SELESAI", updatedAt: { gte: todayStart } },
		}),
		db.driver.count({ where: { status: "AKTIF" } }),
		db.shipment.findMany({
			where: baseWhere,
			include: { item: true, destination: true },
			orderBy: { updatedAt: "desc" },
			take: 5,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	return NextResponse.json(
		{
			shipments: shipments.map((s) => ({
				id: s.id,
				item: s.item.name,
				code: s.code,
				qty: `${s.quantity} ${s.item.unit}`,
				destination: s.destination.name,
				schedule: s.scheduledAt.toLocaleDateString("id-ID", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				}),
				time: s.scheduledAt.toLocaleTimeString("id-ID", {
					hour: "2-digit",
					minute: "2-digit",
				}),
				driver: s.driver ? s.driver.name : "-",
				vehicle: s.vehicle ? `${s.vehicle.model} (${s.vehicle.plateNumber})` : "-",
				status: s.status,
				raw: {
					id: s.id,
					itemId: s.itemId,
					quantity: s.quantity,
					destinationId: s.destinationId,
					scheduledAt: s.scheduledAt.toISOString(),
					driverId: s.driverId,
					vehicleId: s.vehicleId,
				},
			})),
			stats: {
				scheduled: scheduledCount,
				shipping: shippingCount,
				doneToday,
				activeDrivers,
			},
			recentActivity: recentShipments.map((s) => ({
				title:
					s.status === "SELESAI"
						? "Pengiriman Selesai"
						: s.status === "DIKIRIM"
							? "Driver Berangkat"
							: s.status === "DIBATALKAN"
								? "Pengiriman Dibatalkan"
								: "Jadwal Diperbarui",
				desc: `${s.item.name} untuk ${s.destination.name}`,
				time: s.updatedAt.toISOString(),
				type:
					s.status === "SELESAI"
						? "success"
						: s.status === "DIKIRIM"
							? "shipping"
							: "update",
			})),
			pagination: { page, pageSize, totalItems, totalPages },
		},
		{
			headers: { "Cache-Control": "no-store, max-age=0" },
		},
	);
}

function generateShipmentCode() {
	const random = Math.floor(10000 + Math.random() * 90000);
	const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
	return `#TRX-${random}-${suffix}`;
}

export async function POST(request: Request) {
	const body = await request.json();
	const { itemId, quantity, destinationId, scheduledAt, driverId, vehicleId } =
		body;

	if (!itemId || !quantity || !destinationId || !scheduledAt) {
		return NextResponse.json(
			{ error: "Field wajib belum lengkap" },
			{ status: 400 },
		);
	}

	const user = await db.user.findFirst({ where: { role: "ADMIN" } });
	if (!user) {
		return NextResponse.json(
			{ error: "Tidak ada user admin terdaftar" },
			{ status: 400 },
		);
	}

	const shipment = await db.shipment.create({
		data: {
			code: generateShipmentCode(),
			itemId,
			quantity: Number(quantity),
			destinationId,
			scheduledAt: new Date(scheduledAt),
			driverId: driverId || null,
			vehicleId: vehicleId || null,
			status: "DIJADWALKAN",
			sourceChannel: "WEB",
			createdById: user.id,
		},
	});

	await invalidateShipmentsCache();

	return NextResponse.json({ shipment }, { status: 201 });
}
