import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

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

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    // 1. Validasi Autentikasi
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = decodeJWT(token);
    const currentUserRole = (decoded?.role || "").toUpperCase();
    const currentDriverId = decoded?.driverId;
    const currentUserId = decoded?.id; // untuk performedBy

    if (!decoded) {
        return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    // 2. Ambil Data Shipment beserta relasi
    const shipment = await db.shipment.findUnique({
        where: { id },
        include: {
            item: true,
            vehicle: true,
        },
    });

    if (!shipment) {
        return NextResponse.json({ error: "Pengiriman tidak ditemukan" }, { status: 404 });
    }

    // Proteksi Driver
    if (currentUserRole === "DRIVER" && shipment.driverId !== currentDriverId) {
        return NextResponse.json(
            { error: "Akses Ditolak: Anda tidak ditugaskan untuk pengiriman ini." },
            { status: 403 }
        );
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ["DIJADWALKAN", "DIKIRIM", "SELESAI", "DIBATALKAN"];
    if (!status || !validStatuses.includes(status)) {
        return NextResponse.json(
            { error: `Status tidak valid. Pilih salah satu: ${validStatuses.join(", ")}` },
            { status: 400 }
        );
    }

    // Jika hanya update biasa selain SELESAI (misal DIKIRIM atau DIJADWALKAN/DIBATALKAN)
    if (status !== "SELESAI") {
        // Update status kendaraan jika ada vehicleId dan status menjadi DIKIRIM
        if (status === "DIKIRIM" && shipment.vehicleId) {
            await db.vehicle.update({
                where: { id: shipment.vehicleId },
                data: { status: "DIGUNAKAN" },
            });
        }
        // Update status shipment
        const updatedShipment = await db.shipment.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({
            success: true,
            message: `Status berhasil diperbarui menjadi ${status}`,
            shipment: updatedShipment,
        });
    }

    // 3. **Transaksi untuk status SELESAI**
    try {
        const result = await db.$transaction(async (tx) => {
            // a. Dapatkan item dan stok saat ini
            const item = await tx.item.findUnique({
                where: { id: shipment.itemId },
            });
            if (!item) throw new Error("Item tidak ditemukan");

            const currentStock = item.currentStock;
            const quantityChange = shipment.quantity;

            if (currentStock < quantityChange) {
                throw new Error("Stok tidak mencukupi untuk menyelesaikan pengiriman");
            }

            // b. Kurangi Item.currentStock
            const stockAfter = currentStock - quantityChange;
            await tx.item.update({
                where: { id: shipment.itemId },
                data: { currentStock: stockAfter },
            });

            // c. Kurangi ItemBatch.quantityRemaining secara FIFO
            const batches = await tx.itemBatch.findMany({
                where: { itemId: shipment.itemId, quantityRemaining: { gt: 0 } },
                orderBy: { expiryDate: "asc" },
            });

            let remainingToDeduct = quantityChange;
            for (const batch of batches) {
                if (remainingToDeduct <= 0) break;
                const deduct = Math.min(batch.quantityRemaining, remainingToDeduct);
                await tx.itemBatch.update({
                    where: { id: batch.id },
                    data: { quantityRemaining: { decrement: deduct } },
                });
                remainingToDeduct -= deduct;

                // d. Buat StockMovement untuk setiap batch yang digunakan
                await tx.stockMovement.create({
                    data: {
                        type: "DISTRIBUSI",
                        shipmentId: shipment.id,
                        itemId: shipment.itemId,
                        batchId: batch.id,
                        stockBefore: currentStock, // stok item sebelum
                        stockAfter: stockAfter,     // stok item setelah (bisa disesuaikan)
                        quantityChange: -deduct,
                        performedById: currentUserId || shipment.driverId || "",
                        createdAt: new Date(),
                    },
                });
            }

            if (remainingToDeduct > 0) {
                throw new Error("Stok batch tidak mencukupi untuk jumlah yang dikirim");
            }

            // e. Update status shipment
            await tx.shipment.update({
                where: { id },
                data: { status: "SELESAI" },
            });

            // f. Kembalikan status kendaraan jika ada
            if (shipment.vehicleId) {
                await tx.vehicle.update({
                    where: { id: shipment.vehicleId },
                    data: { status: "TERSEDIA" },
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: "Status berhasil diperbarui menjadi SELESAI, stok telah dikurangi.",
        });
    } catch (error: any) {
        console.error("Error completing shipment:", error);
        return NextResponse.json(
            { error: error.message || "Gagal menyelesaikan pengiriman" },
            { status: 400 }
        );
    }
}