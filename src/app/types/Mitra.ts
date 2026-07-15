export interface ApiMitra {
	id: string;
	name: string;
	code: string;
	type: "KLINIK" | "RUMAH_SAKIT" | "APOTEK";
	address: string;
	phone: string;
	status: "AKTIF" | "NONAKTIF";
	lastDeliveryAt: string | null;
	updatedAt: string;
}

export interface MitraStats {
	totalMitra: number;
	activeMitra: number;
	klinikCount: number;
	rsCount: number;
}

export interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
