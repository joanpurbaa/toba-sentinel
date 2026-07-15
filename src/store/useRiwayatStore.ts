import { create } from "zustand";
import type { AuditLog, AuditLogStats } from "@/app/types/Riwayat";

interface RiwayatStore {
	searchQuery: string;
	page: number;
	pageSize: number;
	logs: AuditLog[];
	total: number;
	stats: AuditLogStats;
	isLoading: boolean;

	setSearchQuery: (value: string) => void;
	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	fetchAuditLogs: () => Promise<void>;
}

export const useRiwayatStore = create<RiwayatStore>((set, get) => ({
	searchQuery: "",
	page: 1,
	pageSize: 10,
	logs: [],
	total: 0,
	stats: { todayCount: 0, manualCorrections: 0 },
	isLoading: true,

	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),

	fetchAuditLogs: async () => {
		const { searchQuery, page, pageSize } = get();
		set({ isLoading: true });
		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		const response = await fetch(`/api/audit-logs?${params.toString()}`);
		const data = await response.json();
		set({
			logs: data.logs ?? [],
			total: data.total ?? 0,
			stats: data.stats ?? { todayCount: 0, manualCorrections: 0 },
			isLoading: false,
		});
	},
}));
