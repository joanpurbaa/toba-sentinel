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
	totalItems: number;
	criticalStockCount: number;
	shipmentsToday: { total: number; completed: number; inProgress: number };
	lastActivity: string;
	criticalStockList: CriticalStockItem[];
	recentActivities: Activity[];
}
