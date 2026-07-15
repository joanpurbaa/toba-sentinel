"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDistribusiStore } from "@/store/useDistribusiStore";
import {
    TruckIcon,
    CheckCircle2Icon,
    MapPinIcon,
    PackageIcon,
    ClockIcon,
    AlertCircleIcon,
    ArrowLeftIcon,
} from "lucide-react";

interface ShipmentDetail {
    id: string;
    code: string;
    item: string;
    quantity: number;
    destination: string;
    scheduledAt: string;
    driver: string;
    vehicle: string;
    status: "DIJADWALKAN" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";
}

export default function DriverDistribusiDetail() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const shipmentId = params.id;

    const { updateStatus, sendTrackingCoordinate } = useDistribusiStore();

    const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const latestPositionRef = useRef<{ lat: number; lng: number } | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/distribusi/${shipmentId}`);
            if (!res.ok) throw new Error("Gagal mengambil data pengiriman");
            const data = await res.json();
            setShipment(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Gagal memuat detail");
        } finally {
            setLoading(false);
        }
    }, [shipmentId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung perangkat ini.");
            return;
        }
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (intervalRef.current !== null) clearInterval(intervalRef.current);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                latestPositionRef.current = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
            },
            (err) => console.error("GPS error:", err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );

        intervalRef.current = setInterval(async () => {
            const pos = latestPositionRef.current;
            if (pos && shipmentId) {
                try {
                    await sendTrackingCoordinate(shipmentId, pos.lat, pos.lng);
                } catch (err) {
                    console.error("Gagal mengirim koordinat:", err);
                }
            }
        }, 5000);
    }, [shipmentId, sendTrackingCoordinate]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        latestPositionRef.current = null;
    }, []);

    useEffect(() => {
        if (shipment && shipment.status === "DIKIRIM") {
            startTracking();
        }
        return () => stopTracking();
    }, [shipment, startTracking, stopTracking]);

    const handleStartTrip = async () => {
        if (!shipment) return;
        setActionLoading(true);
        try {
            const result = await updateStatus(shipment.id, "DIKIRIM");
            if (!result.ok) {
                alert(result.error || "Gagal memperbarui status");
                return;
            }
            setShipment(prev => prev ? { ...prev, status: "DIKIRIM" } : null);
            startTracking();
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinishTrip = async () => {
        if (!shipment) return;
        setActionLoading(true);
        try {
            stopTracking();
            const result = await updateStatus(shipment.id, "SELESAI");
            if (!result.ok) {
                alert(result.error || "Gagal menyelesaikan pengiriman");
                return;
            }
            router.push("/driver");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Memuat...</div>;
    if (error || !shipment) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <AlertCircleIcon className="w-10 h-10 text-red-500 mb-3" />
                <h2 className="font-bold text-lg">Gagal Memuat</h2>
                <p className="text-sm text-muted-foreground mt-1">{error || "Data tidak ditemukan"}</p>
                <button onClick={() => router.push("/driver")} className="mt-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
            <button onClick={() => router.push("/driver")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit">
                <ArrowLeftIcon className="w-4 h-4" /> Kembali
            </button>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-lg font-bold text-foreground">Detail Pengiriman</h1>
                    <span className="px-3 py-1 text-xs font-semibold bg-muted rounded-full">{shipment.code}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2"><PackageIcon className="w-4 h-4 text-cyan-600" /><span className="text-muted-foreground">Barang:</span><span className="font-medium text-foreground">{shipment.item}</span></div>
                    <div className="flex items-center gap-2"><span className="text-muted-foreground">Jumlah:</span><span className="font-bold text-foreground">{shipment.quantity}</span></div>
                    <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-red-500" /><span className="text-muted-foreground">Tujuan:</span><span className="font-medium text-foreground">{shipment.destination}</span></div>
                    <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Jadwal:</span><span className="font-medium text-foreground">{new Date(shipment.scheduledAt).toLocaleString("id-ID")}</span></div>
                    <div className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-amber-600" /><span className="text-muted-foreground">Kendaraan:</span><span className="font-medium text-foreground">{shipment.vehicle}</span></div>
                    <div className="flex items-center gap-2"><span className="text-muted-foreground">Driver:</span><span className="font-medium text-foreground">{shipment.driver}</span></div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${shipment.status === "DIJADWALKAN" ? "bg-blue-50 text-blue-700" : shipment.status === "DIKIRIM" ? "bg-amber-50 text-amber-700 animate-pulse" : "bg-emerald-50 text-emerald-700"}`}>
                            {shipment.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                {shipment.status === "DIJADWALKAN" && (
                    <button onClick={handleStartTrip} disabled={actionLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm disabled:opacity-50">
                        <TruckIcon className="w-5 h-5" /> {actionLoading ? "Memproses..." : "Mulai Perjalanan"}
                    </button>
                )}
                {shipment.status === "DIKIRIM" && (
                    <button onClick={handleFinishTrip} disabled={actionLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50">
                        <CheckCircle2Icon className="w-5 h-5" /> {actionLoading ? "Menyelesaikan..." : "Selesai"}
                    </button>
                )}
            </div>
            {shipment.status === "DIKIRIM" && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-sm text-emerald-800">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    Tracking GPS aktif – mengirim koordinat setiap 5 detik
                </div>
            )}
        </div>
    );
}