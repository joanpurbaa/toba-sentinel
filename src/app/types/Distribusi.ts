import type { LucideIcon } from "lucide-react";

export interface DeliveryCard {
	title: string;
	value: string;
	change: string;
	trend: "up" | "down" | "neutral" | "";
	icon: LucideIcon;
	color: string;
}

export interface ShippingItem {
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
		driverId: string | null;
		vehicleId: string | null;
	};
}

export interface ActivityLog {
	title: string;
	desc: string;
	time: string;
	type: "success" | "shipping" | "update";
}

export interface DistribusiStats {
	scheduled: number;
	shipping: number;
	doneToday: number;
	activeDrivers: number;
}

export interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface TrackingPoint {
	latitude: number;
	longitude: number;
	recordedAt: string;
}

export interface TrackingData {
	destination: {
		name: string;
		address: string | null;
		latitude: number | null;
		longitude: number | null;
	};
	route: TrackingPoint[];
	status: string;
}