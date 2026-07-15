"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    PackageIcon,
    TruckIcon,
    CheckCircle2Icon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    AlertCircleIcon,
    LayersIcon,
} from "lucide-react";

interface Shipment {
    id: string;
    item: string;
    code: string;
    qty: string;
    destination: string;
    schedule: string;
    time: string;
    driver: string;
    vehicle: string;
    status: "DIJADWALKAN" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";
    raw: {
        id: string;
        itemId: string;
        quantity: number;
        destinationId: string;
        scheduledAt: string;
        driverId: string;
        vehicleId: string;
    };
}

interface Stats {
    scheduled: number;
    shipping: number;
    doneToday: number;
    activeDrivers: number;
}

export default function DriverDashboard() {
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function checkRoleAndFetchData() {
            try {
                setIsLoading(true);
                const authRes = await fetch("/api/auth/me", { credentials: "include" });
                if (!authRes.ok) {
                    router.replace("/masuk");
                    return;
                }
                const authData = await authRes.json();
                if (authData.role && authData.role.toUpperCase() !== "DRIVER") {
                    router.replace("/dashboard");
                    return;
                }

                const res = await fetch("/api/distribusi");
                if (!res.ok) throw new Error("Gagal mengambil data distribusi");
                const data = await res.json();
                setShipments(data.shipments || []);
                setStats(data.stats || null);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        checkRoleAndFetchData();
    }, [router]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "DIJADWALKAN": return "bg-blue-50 text-blue-700 border-blue-100";
            case "DIKIRIM": return "bg-amber-50 text-amber-700 border-amber-100 animate-pulse";
            case "SELESAI": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "DIBATALKAN": return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    const activeShipments = shipments.filter(s => s.status === "DIJADWALKAN" || s.status === "DIKIRIM");
    const historyShipments = shipments.filter(s => s.status === "SELESAI" || s.status === "DIBATALKAN");

    const statsData = stats ? [
        { title: "Tugas Dijadwalkan", value: String(stats.scheduled), change: "Menunggu untuk diproses", icon: CalendarIcon, iconColor: "text-icon-default" },
        { title: "Sedang Dikirim", value: String(stats.shipping), change: "Dalam perjalanan kurir", icon: TruckIcon, iconColor: "text-icon-warning" },
        { title: "Selesai Hari Ini", value: String(stats.doneToday), change: "Pengiriman sukses terkonfirmasi", icon: CheckCircle2Icon, iconColor: "text-secondary" },
        { title: "Kendaraan Operasional", value: shipments[0]?.vehicle || "Unit Aktif", change: shipments[0]?.driver || "Driver Terdaftar", icon: UserIcon, iconColor: "text-icon-default" },
    ] : [];

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-4 text-center">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl mb-3">
                    <AlertCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-foreground">Gagal Memuat Data</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Driver Logistics Dashboard</h1>
            </div>

            {/* Grid Stats */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading && Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="p-5 bg-card border border-border rounded-xl shadow-xs h-[130px] animate-pulse" />
                ))}
                {!isLoading && statsData.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="p-5 bg-card border border-border rounded-xl shadow-xs flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                                <div className={`p-2 rounded-lg ${stat.iconColor} shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                                <p className="text-xs mt-1 font-medium text-muted-foreground line-clamp-1">{stat.change}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SECTION KIRI: TUGAS AKTIF */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <LayersIcon className="w-4 h-4 text-muted-foreground" /> Tugas Aktif
                    </h2>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3.5">Kode / Jadwal</th>
                                <th className="px-6 py-3.5">Tujuan</th>
                                <th className="px-6 py-3.5">Muatan</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm text-foreground">
                            {isLoading && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Memuat...</td></tr>
                            )}
                            {!isLoading && activeShipments.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Tidak ada tugas aktif.</td></tr>
                            )}
                            {!isLoading && activeShipments.map(shipment => (
                                <tr key={shipment.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-muted border border-border px-2 py-0.5 rounded text-foreground block w-max">{shipment.code}</span>
                                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                            <ClockIcon className="w-3 h-3" /> {shipment.schedule} ({shipment.time})
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold flex items-center gap-1.5">
                                            <MapPinIcon className="w-3.5 h-3.5 text-red-500 shrink-0" /> {shipment.destination}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium flex items-center gap-1.5">
                                            <PackageIcon className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> {shipment.item}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Volume: <span className="font-bold">{shipment.qty}</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(shipment.status)}`}>
                                            {shipment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {shipment.status === "DIJADWALKAN" && (
                                            <button onClick={() => router.push(`/driver/distribusi/${shipment.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg">
                                                <TruckIcon className="w-3.5 h-3.5" /> Lihat Detail
                                            </button>
                                        )}
                                        {shipment.status === "DIKIRIM" && (
                                            <button onClick={() => router.push(`/driver/distribusi/${shipment.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                                                <CheckCircle2Icon className="w-3.5 h-3.5" /> Lanjutkan
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION KANAN: RIWAYAT */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle2Icon className="w-4 h-4 text-muted-foreground" /> Riwayat
                    </h2>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-3.5">Kode / Jadwal</th>
                                <th className="px-6 py-3.5">Tujuan</th>
                                <th className="px-6 py-3.5">Muatan</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm text-foreground">
                            {!isLoading && historyShipments.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada riwayat pengiriman.</td></tr>
                            )}
                            {!isLoading && historyShipments.map(shipment => (
                                <tr key={shipment.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-muted border border-border px-2 py-0.5 rounded text-foreground block w-max">{shipment.code}</span>
                                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                            <ClockIcon className="w-3 h-3" /> {shipment.schedule} ({shipment.time})
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold flex items-center gap-1.5">
                                            <MapPinIcon className="w-3.5 h-3.5 text-red-500 shrink-0" /> {shipment.destination}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium flex items-center gap-1.5">
                                            <PackageIcon className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> {shipment.item}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Volume: <span className="font-bold">{shipment.qty}</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusStyle(shipment.status)}`}>
                                            {shipment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {shipment.status === "SELESAI" && (
                                            <span className="text-xs font-medium text-emerald-600 inline-flex items-center gap-1 p-1">
                                                <CheckCircle2Icon className="w-3.5 h-3.5" /> Terkirim
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}