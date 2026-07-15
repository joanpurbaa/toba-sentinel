import type { LucideIcon } from "lucide-react";

export interface AuditStat {
	text: string;
	color: string;
}

export interface SystemMetric {
	title: string;
	value: string;
	icon: LucideIcon;
	bg: string;
}

export interface AuditLog {
	date: string;
	time: string;
	user: string;
	initials: string;
	action: string;
	actionType: "addition" | "distribution" | "correction" | "reduction";
	targetItem: string;
	targetDetail: string;
	change: string;
	changeType: "positive" | "negative";
	source: "web" | "system";
}

export interface AuditStat {
	text: string;
	color: string;
}

export interface SystemMetric {
	title: string;
	value: string;
	icon: LucideIcon;
	bg: string;
}

export interface AuditLog {
	date: string;
	time: string;
	user: string;
	initials: string;
	action: string;
	actionType: "addition" | "distribution" | "correction" | "reduction";
	targetItem: string;
	targetDetail: string;
	change: string;
	changeType: "positive" | "negative";
	source: "web" | "system";
}

export interface AuditLogStats {
	todayCount: number;
	manualCorrections: number;
}

export interface AuditLogResponse {
	logs: AuditLog[];
	total: number;
	page: number;
	pageSize: number;
	stats: AuditLogStats;
}