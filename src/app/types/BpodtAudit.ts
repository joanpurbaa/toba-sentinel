import type { BpodtVerification, PlaceCategory } from "@prisma/client";

export interface BpodtAuditItem {
	id: string;
	placeCode: string;
	name: string;
	category: PlaceCategory;
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	rating: number | null;
	operationalHour: string | null;
	bpodtVerified: BpodtVerification;
	bpodtNote: string | null;
	updatedAt: string;
	issuesCount: number;
	negativeReviewsCount: number;
}

export interface BpodtAuditDetail extends BpodtAuditItem {
	facilitiesOrActivities: string | null;
	description: string | null;
	ownerName: string | null;
	priceRaw: string | null;
	recentReviews: {
		id: string;
		reviewerName: string | null;
		reviewerRating: number | null;
		reviewText: string | null;
		scrapedAtDate: string | null;
	}[];
	issueSummaries: {
		category: string;
		negativeCount: number;
		totalMentions: number;
		gapScore: number;
	}[];
}

export interface PaginationData {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface BpodtAuditSummary {
	totalPlaces: number;
	sinkronCount: number;
	tidakSinkronCount: number;
	belumDicekCount: number;
}
