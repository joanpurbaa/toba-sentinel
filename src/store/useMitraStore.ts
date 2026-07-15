import { create } from "zustand";

interface Destination {
	id: string;
	name: string;
	address: string | null;
	phone: string | null;
	latitude: number | null;
	longitude: number | null;
}

interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

interface MitraStore {
	destinations: Destination[];
	pagination: Pagination | null;
	searchQuery: string;
	page: number;
	pageSize: number;
	isLoading: boolean;
	deleteTargetId: string | null;
	deleteError: string | null;

	setSearchQuery: (query: string) => void;
	setPage: (value: number) => void;
	setPageSize: (value: number) => void;
	setDeleteTargetId: (id: string | null) => void;
	setDeleteError: (error: string | null) => void;

	fetchDestinations: () => Promise<void>;
	deleteMitra: (id: string) => Promise<boolean>;
}

export const useMitraStore = create<MitraStore>((set, get) => ({
	destinations: [],
	pagination: null,
	searchQuery: "",
	page: 1,
	pageSize: 10,
	isLoading: false,
	deleteTargetId: null,
	deleteError: null,

	setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
	setPage: (value) => set({ page: value }),
	setPageSize: (value) => set({ pageSize: value, page: 1 }),
	setDeleteTargetId: (id) => set({ deleteTargetId: id }),
	setDeleteError: (error) => set({ deleteError: error }),

	fetchDestinations: async () => {
		const { searchQuery, page, pageSize } = get();
		set({ isLoading: true });
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set("search", searchQuery);
			params.set("page", String(page));
			params.set("pageSize", String(pageSize));

			const res = await fetch(`/api/destinations?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				set({
					destinations: data.destinations ?? [],
					pagination: data.pagination ?? null,
				});
			}
		} catch (error) {
			console.error("Gagal memuat data mitra:", error);
		} finally {
			set({ isLoading: false });
		}
	},

	deleteMitra: async (id) => {
		set({ deleteError: null });
		try {
			const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });

			const contentType = res.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				set({ deleteError: `Gagal menghubungi server (Status: ${res.status}).` });
				return false;
			}

			const data = await res.json();

			if (!res.ok) {
				set({ deleteError: data.error ?? "Gagal menghapus mitra" });
				return false;
			}

			set({ deleteTargetId: null });
			await get().fetchDestinations();
			return true;
		} catch (error) {
			console.error("Gagal menghapus mitra:", error);
			set({ deleteError: "Terjadi kesalahan koneksi saat menghapus mitra." });
			return false;
		}
	},
}));
