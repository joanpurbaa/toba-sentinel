import { create } from "zustand";
import type {
	SopirLog,
	KendaraanLog,
	PetugasSummary,
	Pagination,
} from "@/app/types/Petugas";

interface PetugasStore {
	summary: PetugasSummary | null;
	sopirLogs: SopirLog[];
	kendaraanLogs: KendaraanLog[];
	sopirPagination: Pagination | null;
	kendaraanPagination: Pagination | null;
	sopirPage: number;
	sopirPageSize: number;
	kendaraanPage: number;
	kendaraanPageSize: number;
	isLoading: boolean;

	setSopirPage: (page: number) => void;
	setSopirPageSize: (size: number) => void;
	setKendaraanPage: (page: number) => void;
	setKendaraanPageSize: (size: number) => void;

	fetchSummary: () => Promise<void>;
	fetchDrivers: () => Promise<void>;
	fetchVehicles: () => Promise<void>;
	fetchAll: () => Promise<void>;
}

export const usePetugasStore = create<PetugasStore>((set, get) => ({
	summary: null,
	sopirLogs: [],
	kendaraanLogs: [],
	sopirPagination: null,
	kendaraanPagination: null,
	sopirPage: 1,
	sopirPageSize: 10,
	kendaraanPage: 1,
	kendaraanPageSize: 10,
	isLoading: true,

	setSopirPage: (page) => set({ sopirPage: page }),
	setSopirPageSize: (size) => set({ sopirPageSize: size, sopirPage: 1 }),
	setKendaraanPage: (page) => set({ kendaraanPage: page }),
	setKendaraanPageSize: (size) =>
		set({ kendaraanPageSize: size, kendaraanPage: 1 }),

	fetchSummary: async () => {
		const summaryData = await fetch("/api/petugas/summary").then((r) => r.json());
		set({ summary: summaryData });
	},

	fetchDrivers: async () => {
		const { sopirPage, sopirPageSize } = get();
		const driversData = await fetch(
			`/api/drivers?page=${sopirPage}&pageSize=${sopirPageSize}`,
		).then((r) => r.json());
		set({
			sopirLogs: driversData.drivers ?? [],
			sopirPagination: driversData.pagination ?? null,
		});
	},

	fetchVehicles: async () => {
		const { kendaraanPage, kendaraanPageSize } = get();
		const vehiclesData = await fetch(
			`/api/vehicles?page=${kendaraanPage}&pageSize=${kendaraanPageSize}`,
		).then((r) => r.json());
		set({
			kendaraanLogs: vehiclesData.vehicles ?? [],
			kendaraanPagination: vehiclesData.pagination ?? null,
		});
	},

	fetchAll: async () => {
		set({ isLoading: true });
		await Promise.all([
			get().fetchSummary(),
			get().fetchDrivers(),
			get().fetchVehicles(),
		]);
		set({ isLoading: false });
	},
}));
