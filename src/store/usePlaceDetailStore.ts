import { create } from "zustand";

type IssueSummary = {
	category: string;
	negativeCount: number;
	totalMentions: number;
	gapScore: number;
};

type Review = {
	id: string;
	reviewerName: string | null;
	reviewerRating: number | null;
	reviewText: string | null;
	publishedAtRaw: string | null;
	isNegativeSource?: boolean;
	issueTags?: { category: string; confidence: number }[];
};

type PlaceDetail = {
	id: string;
	placeCode: string;
	name: string;
	category: string;
	subtype: string | null;
	priceMin: number | null;
	priceMax: number | null;
	priceRaw: string | null;
	address: string | null;
	operationalHour: string | null;
	rating: number | null;
	facilitiesOrActivities: string | null;
	description: string | null;
	ownershipType: string;
	ownerName: string | null;
	issueSummaries: IssueSummary[];
	reviews: Review[];
};

interface PlaceDetailStore {
	place: PlaceDetail | null;
	isLoading: boolean;
	notFound: boolean;

	fetchPlace: (id: string) => Promise<void>;
	reset: () => void;
}

export const usePlaceDetailStore = create<PlaceDetailStore>((set) => ({
	place: null,
	isLoading: false,
	notFound: false,

	fetchPlace: async (id: string) => {
		set({ isLoading: true, notFound: false });
		try {
			const response = await fetch(`/api/places/${id}`);
			if (!response.ok) {
				if (response.status === 404) {
					set({ notFound: true, isLoading: false });
					return;
				}
				throw new Error("Failed to fetch place");
			}
			const data = await response.json();
			set({ place: data, isLoading: false });
		} catch (error) {
			set({ notFound: true, isLoading: false });
			console.error("Failed to fetch place detail:", error);
		}
	},

	reset: () => set({ place: null, isLoading: false, notFound: false }),
}));
