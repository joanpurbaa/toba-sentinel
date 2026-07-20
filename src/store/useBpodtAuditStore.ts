import { create } from "zustand";
import type {
	BpodtAuditItem,
	BpodtAuditSummary,
	PaginationData,
} from "@/app/types/BpodtAudit";

interface BpodtAuditStore {
	items: BpodtAuditItem[];
	pagination: PaginationData | null;
	summary: BpodtAuditSummary | null;
	isLoading: boolean;
	page: number;
	pageSize: number;
	searchQuery: string;
	categoryFilter: string;
	bpodtStatusFilter: string;

	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setSearchQuery: (value: string) => void;
	setCategoryFilter: (value: string) => void;
	setBpodtStatusFilter: (value: string) => void;

	fetchItems: () => Promise<void>;
	updateAuditStatus: (
		id: string,
		bpodtVerified: string,
		bpodtNote: string | null,
	) => Promise<boolean>;
}

export const useBpodtAuditStore = create<BpodtAuditStore>((set, get) => ({
	items: [],
	pagination: null,
	summary: null,
	isLoading: false,
	page: 1,
	pageSize: 10,
	searchQuery: "",
	categoryFilter: "Semua Kategori",
	bpodtStatusFilter: "Semua Status",

	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
	setCategoryFilter: (value) => set({ categoryFilter: value, page: 1 }),
	setBpodtStatusFilter: (value) => set({ bpodtStatusFilter: value, page: 1 }),

	fetchItems: async () => {
		const { searchQuery, categoryFilter, bpodtStatusFilter, page, pageSize } =
			get();
		set({ isLoading: true });

		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		if (categoryFilter !== "Semua Kategori")
			params.set("category", categoryFilter);
		if (bpodtStatusFilter !== "Semua Status")
			params.set("bpodtStatus", bpodtStatusFilter);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		try {
			const response = await fetch(`/api/admin/bpodt-audit?${params.toString()}`);
			const data = await response.json();

			set({
				items: data.items ?? [],
				pagination: data.pagination ?? null,
				summary: data.summary ?? null,
				isLoading: false,
			});
		} catch {
			set({ isLoading: false });
		}
	},

	updateAuditStatus: async (id, bpodtVerified, bpodtNote) => {
		try {
			const res = await fetch("/api/admin/bpodt-audit", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, bpodtVerified, bpodtNote }),
			});

			if (!res.ok) return false;

			await get().fetchItems();
			return true;
		} catch {
			return false;
		}
	},
}));
