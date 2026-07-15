import { create } from "zustand";
import { DashboardData } from "@/app/types/Dashboard";

interface DashboardStore {
	data: DashboardData | null;
	isLoading: boolean;
	fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
	data: null,
	isLoading: false,
	fetchDashboard: async () => {
		set({ isLoading: true });

		const response = await fetch("/api/dashboard");
		const json = await response.json();

		set({ data: json, isLoading: false });
	},
}));
