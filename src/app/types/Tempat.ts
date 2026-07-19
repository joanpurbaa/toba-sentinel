export type PlaceCategory = "WISATA" | "HOTEL" | "RESTO";
export type PlaceStatus = "BEROPERASI" | "TUTUP";

export interface ApiPlace {
	id: string;
	placeCode: string;
	name: string;
	category: PlaceCategory;
	subtype: string | null;
	starRating: number | null;
	priceMin: number | null;
	priceMax: number | null;
	priceRaw: string | null;
	latitude: number | null;
	longitude: number | null;
	address: string | null;
	operationalHour: string | null;
	rating: number | null;
	status: PlaceStatus;
	facilitiesOrActivities: string | null;
	description: string | null;
	ownerName: string | null;
	bpodtVerified: "BELUM_DICEK" | "SINKRON" | "TIDAK_SINKRON";
	bpodtNote: string | null;
	updatedAt: string;
	aiGapScore: number | null;
	aiTotalMentions: number;
}

export interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface PlaceSummary {
	totalPlaces: number;
	totalWisata: number;
	totalHotel: number;
	totalResto: number;
}
