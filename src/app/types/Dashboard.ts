export interface CriticalStockItem {
	name: string;
	sku: string;
	category: string;
	stock: string;
	status: string;
	type: "kritis" | "menipis";
}
export interface Activity {
	title: string;
	time: string;
	user: string;
	detail: string;
	isLatest: boolean;
}
export interface DashboardData {
	totalPlaces: number;
	placesByCategory: { category: string; count: number }[];
	reviewCoverage: { total: number; tagged: number };
	topGapAreas: {
		placeName: string;
		category: string;
		gapScore: number;
		negativeCount: number;
		totalMentions: number;
	}[];
	reportsByStatus: { status: string; count: number }[];
	recentReports: {
		title: string;
		placeName: string;
		filedBy: string;
		category: string;
		status: string;
		createdAt: string;
	}[];
}

