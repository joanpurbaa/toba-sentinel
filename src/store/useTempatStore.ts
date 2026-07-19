import { create } from "zustand";
import type {
	ApiPlace,
	Pagination as PaginationData,
	PlaceSummary,
} from "@/app/types/Tempat";

interface TempatStore {
	items: ApiPlace[];
	pagination: PaginationData | null;
	summary: PlaceSummary | null;
	isLoading: boolean;
	page: number;
	pageSize: number;
	searchQuery: string;
	categoryFilter: string;
	bpodtFilter: string;
	sortBy: string;

	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setSearchQuery: (value: string) => void;
	setCategoryFilter: (value: string) => void;
	setBpodtFilter: (value: string) => void;
	setSortBy: (value: string) => void;

	fetchItems: () => Promise<void>;
	fetchSummary: () => Promise<void>;
}

export const useTempatStore = create<TempatStore>((set, get) => ({
	items: [],
	pagination: null,
	summary: null,
	isLoading: false,
	page: 1,
	pageSize: 10,
	searchQuery: "",
	categoryFilter: "Semua Kategori",
	bpodtFilter: "Semua Status BPODT",
	sortBy: "terbaru",

	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
	setCategoryFilter: (value) => set({ categoryFilter: value, page: 1 }),
	setBpodtFilter: (value) => set({ bpodtFilter: value, page: 1 }),
	setSortBy: (value) => set({ sortBy: value, page: 1 }),

	fetchItems: async () => {
		const { searchQuery, categoryFilter, bpodtFilter, sortBy, page, pageSize } =
			get();
		set({ isLoading: true });

		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		if (categoryFilter !== "Semua Kategori")
			params.set("category", categoryFilter);
		if (bpodtFilter !== "Semua Status BPODT") params.set("bpodt", bpodtFilter);
		params.set("sort", sortBy);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		const response = await fetch(`/api/admin/places?${params.toString()}`);
		const data = await response.json();

		set({
			items: data.items ?? [],
			pagination: data.pagination ?? null,
			isLoading: false,
		});
	},

	fetchSummary: async () => {
		const response = await fetch("/api/admin/places/summary");
		const data = await response.json();
		set({ summary: data });
	},
}));
