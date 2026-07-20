import { create } from "zustand";

interface Proposal {
	id: string;
	worstCategory: string;
	worstGapScore: number;
	urgencyScore: number;
	affectedUmkmCount: number;
	status: string;
	approvedAmount: number | null;
	fundingSource: string | null;
	notes: string | null;
	kabupaten: string;
	place: { id: string; name: string; placeCode: string; address: string | null };
	approvedBy: { name: string } | null;
}

interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface AnggaranStore {
	items: Proposal[];
	pagination: Pagination | null;
	maxUrgency: number;
	availableKabupaten: string[];
	isLoading: boolean;
	page: number;
	pageSize: number;
	searchQuery: string;
	categoryFilter: string;
	kabupatenFilter: string;

	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setSearchQuery: (value: string) => void;
	setCategoryFilter: (value: string) => void;
	setKabupatenFilter: (value: string) => void;

	fetchItems: () => Promise<void>;
}

export const useAnggaranStore = create<AnggaranStore>((set, get) => ({
	items: [],
	pagination: null,
	maxUrgency: 1,
	availableKabupaten: [],
	isLoading: false,
	page: 1,
	pageSize: 10,
	searchQuery: "",
	categoryFilter: "Semua Kategori",
	kabupatenFilter: "Semua Kabupaten",

	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),
	setCategoryFilter: (value) => set({ categoryFilter: value, page: 1 }),
	setKabupatenFilter: (value) => set({ kabupatenFilter: value, page: 1 }),

	fetchItems: async () => {
		const { searchQuery, categoryFilter, kabupatenFilter, page, pageSize } =
			get();
		set({ isLoading: true });

		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		if (categoryFilter !== "Semua Kategori")
			params.set("category", categoryFilter);
		if (kabupatenFilter !== "Semua Kabupaten")
			params.set("kabupaten", kabupatenFilter);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		const response = await fetch(
			`/api/admin/budget-proposals?${params.toString()}`,
		);
		const data = await response.json();

		set({
			items: data.items ?? [],
			pagination: data.pagination ?? null,
			maxUrgency: data.maxUrgency ?? 1,
			availableKabupaten: data.availableKabupaten ?? [],
			isLoading: false,
		});
	},
}));
