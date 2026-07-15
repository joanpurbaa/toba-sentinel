import { create } from "zustand";
import type {
    ShippingItem,
    ActivityLog,
    DistribusiStats,
    Pagination,
    TrackingData,
} from "@/app/types/Distribusi";

export type ShipmentStatus = "DIJADWALKAN" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";

interface DistribusiStore {
    searchQuery: string;
    page: number;
    pageSize: number;
    shipments: ShippingItem[];
    stats: DistribusiStats;
    recentActivity: ActivityLog[];
    pagination: Pagination | null;
    isLoading: boolean;

    selectedShipmentId: string | null;
    tracking: TrackingData | null;
    isTrackingLoading: boolean;

    setSearchQuery: (value: string) => void;
    setPage: (value: number) => void;
    setPageSize: (value: number) => void;
    fetchDistribusi: () => Promise<void>;
    setSelectedShipmentId: (id: string | null) => void;
    fetchTracking: (shipmentId: string, silent?: boolean) => Promise<void>;
    deleteShipment: (shipmentId: string) => Promise<void>;
    updateShipment: (
        shipmentId: string,
        payload: Record<string, unknown>,
    ) => Promise<{ ok: boolean; error?: string }>;
    updateStatus: (
        shipmentId: string,
        status: ShipmentStatus,
    ) => Promise<{ ok: boolean; error?: string }>;
    // Tambahan helper untuk driver tracking
    sendTrackingCoordinate: (
        shipmentId: string,
        latitude: number,
        longitude: number,
    ) => Promise<void>;
}

export const useDistribusiStore = create<DistribusiStore>((set, get) => ({
    searchQuery: "",
    page: 1,
    pageSize: 10,
    shipments: [],
    stats: { scheduled: 0, shipping: 0, doneToday: 0, activeDrivers: 0 },
    recentActivity: [],
    pagination: null,
    isLoading: true,

    selectedShipmentId: null,
    tracking: null,
    isTrackingLoading: false,

    setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
    setPage: (value) => set({ page: value }),
    setPageSize: (value) => set({ pageSize: value, page: 1 }),

    fetchDistribusi: async () => {
        const { searchQuery, page, pageSize, selectedShipmentId } = get();
        set({ isLoading: true });

        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        try {
            const response = await fetch(`/api/distribusi?${params.toString()}`);
            const data = await response.json();

            set({
                shipments: data.shipments ?? [],
                stats: data.stats ?? {
                    scheduled: 0,
                    shipping: 0,
                    doneToday: 0,
                    activeDrivers: 0,
                },
                recentActivity: data.recentActivity ?? [],
                pagination: data.pagination ?? null,
                isLoading: false,
            });

            if (!selectedShipmentId) {
                const shipping = (data.shipments ?? []).find(
                    (s: ShippingItem) => s.status === "DIKIRIM",
                );
                if (shipping) get().setSelectedShipmentId(shipping.id);
            }
        } catch (error) {
            console.error("Gagal mengambil data distribusi:", error);
            set({ isLoading: false });
        }
    },

    setSelectedShipmentId: (id) => {
        set({ selectedShipmentId: id, tracking: null });
        if (id) get().fetchTracking(id);
    },

    fetchTracking: async (shipmentId, silent = false) => {
        if (!silent) set({ isTrackingLoading: true });
        try {
            const response = await fetch(`/api/distribusi/${shipmentId}/tracking`);
            const data = await response.json();
            set({ tracking: data, isTrackingLoading: false });
        } catch (error) {
            console.error("Gagal mengambil data tracking:", error);
            set({ isTrackingLoading: false });
        }
    },

    deleteShipment: async (shipmentId) => {
        try {
            await fetch(`/api/distribusi/${shipmentId}`, { method: "DELETE" });
            if (get().selectedShipmentId === shipmentId) {
                set({ selectedShipmentId: null, tracking: null });
            }
            get().fetchDistribusi();
        } catch (error) {
            console.error("Gagal menghapus pengiriman:", error);
        }
    },

    updateShipment: async (shipmentId, payload) => {
        try {
            const response = await fetch(`/api/distribusi/${shipmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                return { ok: false, error: data.error ?? "Gagal memperbarui pengiriman" };
            }
            get().fetchDistribusi();
            return { ok: true };
        } catch (error) {
            return { ok: false, error: "Terjadi kesalahan jaringan" };
        }
    },

    updateStatus: async (shipmentId, status) => {
        try {
            const response = await fetch(`/api/distribusi/${shipmentId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { ok: false, error: data.error ?? "Gagal memperbarui status" };
            }
            get().fetchDistribusi();
            if (get().selectedShipmentId === shipmentId) {
                get().fetchTracking(shipmentId, true);
            }
            return { ok: true };
        } catch (error) {
            return { ok: false, error: "Terjadi kesalahan jaringan" };
        }
    },

    // Fungsi baru untuk mengirim koordinat tracking
    sendTrackingCoordinate: async (shipmentId, latitude, longitude) => {
    console.log("POST TRACKING", {
        shipmentId,
        latitude,
        longitude,
    });

    const response = await fetch(`/api/distribusi/${shipmentId}/tracking`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            latitude,
            longitude,
        }),
    });

    console.log("STATUS:", response.status);

    const data = await response.json();
    console.log("RESPONSE:", data);
},
}));