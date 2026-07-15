export interface StatCard {
	label: string;
	value: string;
	desc: string;
	isWarning?: boolean;
}

export type SopirAssignmentType = "assigned" | "available";

export interface SopirLog {
	id: string;
	nama: string;
	sim: string;
	kontak: string;
	unit: string;
	type: SopirAssignmentType;
}

export type KendaraanStatusType = "active" | "available" | "maintenance";

export interface KendaraanLog {
	id: string;
	plat: string;
	model: string;
	jenis: string;
	sopir: string;
	status: string;
	type: KendaraanStatusType;
}

export interface PetugasSummary {
	totalSopir: number;
	sopirAktif: number;
	totalKendaraan: number;
	dalamPerawatan: number;
}

export interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
