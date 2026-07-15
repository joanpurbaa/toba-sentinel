import { create } from "zustand";
import type {
	ApiItem,
	Pagination as PaginationData,
} from "@/app/types/StokBarang";

interface StokBarangStore {
	items: ApiItem[];
	pagination: PaginationData | null;
	isLoading: boolean;
	page: number;
	pageSize: number;
	searchQuery: string;
	categoryFilter: string;
	statusFilter: string;

	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setSearchQuery: (value: string) => void;
	setCategoryFilter: (value: string) => void;
	setStatusFilter: (value: string) => void;

	fetchItems: () => Promise<void>;
}

export const useStokBarangStore = create<StokBarangStore>((set, get) => ({
	items: [],
	pagination: null,
	isLoading: false,
	page: 1,
	pageSize: 10,
	searchQuery: "",
	categoryFilter: "Semua Kategori",
	statusFilter: "Semua Status",

	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
	setCategoryFilter: (value) => set({ categoryFilter: value, page: 1 }),
	setStatusFilter: (value) => set({ statusFilter: value, page: 1 }),

	fetchItems: async () => {
		const { searchQuery, categoryFilter, statusFilter, page, pageSize } = get();
		set({ isLoading: true });

		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		if (categoryFilter !== "Semua Kategori")
			params.set("category", categoryFilter);
		if (statusFilter !== "Semua Status") params.set("status", statusFilter);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		const response = await fetch(`/api/items?${params.toString()}`);
		const data = await response.json();

		set({
			items: data.items ?? [],
			pagination: data.pagination ?? null,
			isLoading: false,
		});
	},
}));
