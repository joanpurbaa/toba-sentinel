import { create } from "zustand";

type PlacePoint = {
	id: string;
	placeCode: string;
	name: string;
	category: string;
	subtype: string | null;
	latitude: number;
	longitude: number;
	rating: number | null;
	address: string | null;
	aiGapScore: number | null;
	aiTotalMentions: number;
	aiWorstCategory: string | null;
};

type ColorMode = "rating" | "ai";

interface DashboardStore {
	places: PlacePoint[];
	isLoading: boolean;
	colorMode: ColorMode;
	negativeOnly: boolean;
	negativeCount: number;

	setColorMode: (mode: ColorMode) => void;
	setNegativeOnly: (value: boolean) => void;
	fetchPlaces: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
	places: [],
	isLoading: false,
	colorMode: "rating",
	negativeOnly: false,
	negativeCount: 0,

	setColorMode: (mode) => set({ colorMode: mode }),
	setNegativeOnly: (value) => set({ negativeOnly: value }),

	fetchPlaces: async () => {
		set({ isLoading: true });
		try {
			const response = await fetch("/api/places/map");
			const data = await response.json();
			const negativeCount = data.filter(
				(p: PlacePoint) => p.aiGapScore !== null && p.aiGapScore >= 0.5,
			).length;
			set({
				places: data,
				negativeCount,
				isLoading: false,
			});
		} catch (error) {
			set({ isLoading: false });
			console.error("Failed to fetch places:", error);
		}
	},
}));
