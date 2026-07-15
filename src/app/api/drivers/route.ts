import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import * as bcrypt from "bcryptjs"; 

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
        100,
        Math.max(1, Number(searchParams.get("pageSize")) || 10),
    );

    const cacheKey = `pharmasync:drivers:page:${page}:pageSize:${pageSize}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return NextResponse.json(cached);
    }

    const drivers = await db.driver.findMany({
        include: { usualVehicle: true },
        orderBy: { name: "asc" },
    });

    const mapped = drivers.map((d) => ({
        id: d.id,
        nama: d.name,
        sim: `${d.simType} • ${d.simNumber}`,
        kontak: d.phone,
        unit: d.usualVehicle ? d.usualVehicle.plateNumber : "Tersedia",
        type: d.usualVehicle ? "assigned" : "available",
        status: d.status,
    }));

    const totalItems = mapped.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = mapped.slice(start, start + pageSize);

    const payload = {
        drivers: paginated,
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
    try {
        const body = await request.json();
        const { name, simNumber, simType, phone, status, usualVehicleId } = body;

        if (!name || !simNumber || !simType || !phone) {
            return NextResponse.json(
                { error: "Field wajib belum lengkap" },
                { status: 400 },
            );
        }

        // 1. Generate kredensial otomatis untuk User baru
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const generatedEmail = `${cleanName}.${phone.slice(-4)}@pharmasync.com`;
        const defaultPasswordHash = await bcrypt.hash("Sopir123!", 10);

        // 2. Gunakan Prisma Transaction agar pembuatan User dan Driver wajib sukses dua-duanya
        const newDriver = await db.$transaction(async (tx) => {
            // a. Cek dulu apakah email sudah terpakai
            const existingUser = await tx.user.findUnique({
                where: { email: generatedEmail }
            });

            if (existingUser) {
                throw new Error("Email driver sudah terdaftar, coba bedakan nama atau kontak.");
            }

            // b. Buat akun di tabel users
            const userAccount = await tx.user.create({
                data: {
                    name,
                    email: generatedEmail,
                    passwordHash: defaultPasswordHash,
                    role: "DRIVER", // Set langsung ke role DRIVER
                    isActive: true,
                },
            });

            // c. Buat data di tabel drivers dan hubungkan dengan userId yang baru jadi
            const driverData = await tx.driver.create({
                data: {
                    name,
                    simNumber,
                    simType,
                    phone,
                    status: status || "AKTIF",
                    usualVehicleId: usualVehicleId || null,
                    userId: userAccount.id, // <--- Relasi di sini bro
                },
            });

            return driverData;
        });

        // 3. Hapus cache Redis lama biar data sopir baru langsung muncul di list
        const keys = await redis.keys("pharmasync:drivers:page:*");
        if (keys.length) {
            await redis.del(...keys);
        }

        return NextResponse.json({ driver: newDriver }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating driver & user account:", error);
        return NextResponse.json(
            { error: error.message || "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}