export type StockStatus = "AMAN" | "MENIPIS" | "KRITIS" | "PENDING";
export type StorageCondition = "SUHU_RUANG" | "DINGIN" | "BEKU";

export interface ApiItem {
	id: string;
	name: string;
	description: string | null;
	sku: string;
	category: string;
	quantity: number;
	unit: string;
	status: StockStatus;
	storageCondition: StorageCondition;
	isControlledSubstance: boolean;
	nearestExpiry: string | null;
	isExpiringSoon: boolean;
	updatedAt: string;
	minThreshold: number;
	criticalThreshold: number;
	expiryWarningDays: number;	
	registrationNumber: string | null;
}

export interface Pagination {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface ItemBatchDetail {
	id: string;
	batchNumber: string;
	expiryDate: string;
	quantityReceived: number;
	quantityRemaining: number;
	vendorName: string | null;
	receivedAt: string;
	isActive: boolean;
}

export interface ItemDetail {
	id: string;
	name: string;
	description: string | null;
	sku: string;
	category: string;
	unit: string;
	currentStock: number;
	minThreshold: number;
	criticalThreshold: number;
	expiryWarningDays: number;
	storageCondition: StorageCondition;
	registrationNumber: string | null;
	isControlledSubstance: boolean;
	warehouseName: string;
	batches: ItemBatchDetail[];
}
