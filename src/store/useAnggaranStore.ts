import { create } from "zustand";

interface Proposal {
	id: string;
	worstCategory: string;
	worstGapScore: number;
	urgencyScore: number;
	affectedUmkmCount: number;
	status: string;
	approvedAmount: number | null;
	notes: string | null;
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
	isLoading: boolean;
	page: number;
	pageSize: number;
	searchQuery: string;

	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setSearchQuery: (value: string) => void;

	fetchItems: () => Promise<void>;
}

export const useAnggaranStore = create<AnggaranStore>((set, get) => ({
	items: [],
	pagination: null,
	isLoading: false,
	page: 1,
	pageSize: 10,
	searchQuery: "",

	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setSearchQuery: (value) => set({ searchQuery: value, page: 1 }),

	fetchItems: async () => {
		const { searchQuery, page, pageSize } = get();
		set({ isLoading: true });

		const params = new URLSearchParams();
		if (searchQuery) params.set("search", searchQuery);
		params.set("page", String(page));
		params.set("pageSize", String(pageSize));

		const response = await fetch(
			`/api/admin/budget-proposals?${params.toString()}`,
		);
		const data = await response.json();

		set({
			items: data.items ?? [],
			pagination: data.pagination ?? null,
			isLoading: false,
		});
	},
}));
