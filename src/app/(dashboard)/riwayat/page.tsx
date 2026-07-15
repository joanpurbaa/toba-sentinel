"use client";

import { useEffect } from "react";
import {
	SearchIcon,
	SlidersHorizontalIcon,
	DownloadIcon,
	CalendarIcon,
	RefreshCwIcon,
	MonitorIcon,
	BotIcon,
	ShieldCheckIcon,
	ZapIcon,
} from "lucide-react";
import type { SystemMetric } from "@/app/types/Riwayat";
import { useRiwayatStore } from "@/store/useRiwayatStore";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const systemMetrics: SystemMetric[] = [
	{
		title: "Log Terverifikasi",
		value: "100%",
		icon: ShieldCheckIcon,
		bg: "bg-slate-50",
	},
	{ title: "Kecepatan Audit", value: "~0.4s", icon: ZapIcon, bg: "bg-slate-50" },
	{
		title: "Terakhir Sincron",
		value: "Baru saja",
		icon: RefreshCwIcon,
		bg: "bg-slate-50",
	},
];

const PAGE_SIZE = 10;

function getPageNumbers(
	current: number,
	total: number,
): (number | "ellipsis")[] {
	const pages: (number | "ellipsis")[] = [];
	const delta = 1;
	for (let i = 1; i <= total; i++) {
		if (
			i === 1 ||
			i === total ||
			(i >= current - delta && i <= current + delta)
		) {
			pages.push(i);
		} else if (pages[pages.length - 1] !== "ellipsis") {
			pages.push("ellipsis");
		}
	}
	return pages;
}

export default function Riwayat() {
	const searchQuery = useRiwayatStore((state) => state.searchQuery);
	const setSearchQuery = useRiwayatStore((state) => state.setSearchQuery);
	const page = useRiwayatStore((state) => state.page);
	const setPage = useRiwayatStore((state) => state.setPage);
	const logs = useRiwayatStore((state) => state.logs);
	const total = useRiwayatStore((state) => state.total);
	const stats = useRiwayatStore((state) => state.stats);
	const isLoading = useRiwayatStore((state) => state.isLoading);
	const pageSize = useRiwayatStore((state) => state.pageSize);
	const setPageSize = useRiwayatStore((state) => state.setPageSize);
	const fetchAuditLogs = useRiwayatStore((state) => state.fetchAuditLogs);

	useEffect(() => {
		const timeout = setTimeout(fetchAuditLogs, 300);
		return () => clearTimeout(timeout);
	}, [searchQuery, page, pageSize, fetchAuditLogs]);

	const totalPages = Math.max(Math.ceil(total / pageSize), 1);
	const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const rangeEnd = Math.min(page * pageSize, total);

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
					<h1 className="text-xl font-bold tracking-tight text-slate-900">
						Riwayat Audit
					</h1>
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm w-fit">
						<CalendarIcon className="w-3.5 h-3.5 text-icon-default" />
						Oktober 2023 - Sekarang
					</div>
				</div>

				<div className="relative w-full md:w-72">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-icon-default" />
					<input
						type="text"
						placeholder="Cari log atau nama user..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-2">
					<p className="text-sm text-slate-500 font-medium">
						Pantau seluruh aktivitas inventaris medis secara kronologis.
					</p>
					<div className="flex flex-wrap gap-2">
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm">
							<span className="h-2 w-2 rounded-full bg-primary" />
							{stats.todayCount} Transaksi Hari Ini
						</span>
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm">
							<span className="h-2 w-2 rounded-full bg-amber-500" />
							{stats.manualCorrections} Koreksi Manual
						</span>
					</div>
				</div>

				{/* <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end lg:self-auto">
					<button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black  rounded-lg transition-colors shadow-sm flex-1 sm:flex-initial">
						<SlidersHorizontalIcon className="w-3.5 h-3.5 text-icon-default" />
						Filter
					</button>
					<button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary text-black rounded-lg shadow-sm transition-colors flex-1 sm:flex-initial whitespace-nowrap">
						<DownloadIcon className="w-3.5 h-3.5 text-icon-default" />
						Export PDF
					</button>
				</div> */}
			</div>

			<div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[850px]">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								<th className="px-6 py-3.5">Waktu</th>
								<th className="px-6 py-3.5">User</th>
								<th className="px-6 py-3.5">Tipe Aksi</th>
								<th className="px-6 py-3.5">Item Terdampak</th>
								<th className="px-6 py-3.5">Perubahan</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
							{isLoading && (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Memuat data...
									</td>
								</tr>
							)}

							{!isLoading && logs.length === 0 && (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Tidak ada log yang cocok dengan pencarian ini.
									</td>
								</tr>
							)}

							{!isLoading &&
								logs.map((log, idx) => (
									<tr key={idx} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-6 py-4">
											<div className="font-semibold text-slate-900">{log.date}</div>
											<div className="text-[11px] font-mono text-slate-400 mt-0.5">
												{log.time}
											</div>
										</td>

										<td className="px-6 py-4">
											<div className="flex items-center gap-2.5">
												<div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-[11px] font-bold text-white uppercase tracking-wider shrink-0">
													{log.initials}
												</div>
												<span className="font-semibold text-slate-800 whitespace-nowrap">
													{log.user}
												</span>
											</div>
										</td>

										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${log.actionType === "addition"
														? "bg-emerald-50 text-emerald-700 border border-emerald-100/50"
														: log.actionType === "distribution"
															? "bg-blue-50 text-blue-700 border border-blue-100/50"
															: log.actionType === "correction"
																? "bg-amber-50 text-amber-700 border border-amber-100/50"
																: "bg-red-50 text-red-700 border border-red-100/50"
													}`}>
												{log.action}
											</span>
										</td>

										<td className="px-6 py-4">
											<div className="font-semibold text-slate-900">{log.targetItem}</div>
											<div className="text-xs text-slate-400 mt-0.5">
												{log.targetDetail}
											</div>
										</td>

										<td className="px-6 py-4 font-bold">
											<span
												className={
													log.changeType === "positive"
														? "text-emerald-600"
														: "text-blue-600"
												}>
												{log.change}
											</span>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>

				<div className="p-4 bg-white border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-4 order-2 lg:order-1">
						<span className="text-xs text-slate-500 font-medium text-center sm:text-left">
							Menampilkan{" "}
							<span className="font-bold text-slate-700">
								{rangeStart}-{rangeEnd}
							</span>{" "}
							dari{" "}
							<span className="font-bold text-slate-700">
								{total.toLocaleString("id-ID")}
							</span>{" "}
							entri
						</span>

						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-slate-500 whitespace-nowrap">
								Baris per halaman
							</span>
							<Select
								value={String(pageSize)}
								onValueChange={(value) => setPageSize(Number(value))}>
								<SelectTrigger className="h-8 w-[72px] text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Pagination className="order-1 lg:order-2 mx-0 w-auto">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (page > 1) setPage(page - 1);
									}}
									className={page <= 1 ? "pointer-events-none opacity-50" : ""}
								/>
							</PaginationItem>

							{getPageNumbers(page, totalPages).map((pageNumber, idx) =>
								pageNumber === "ellipsis" ? (
									<PaginationItem key={`ellipsis-${idx}`}>
										<PaginationEllipsis />
									</PaginationItem>
								) : (
									<PaginationItem key={pageNumber}>
										<PaginationLink
											href="#"
											isActive={pageNumber === page}
											onClick={(e) => {
												e.preventDefault();
												setPage(pageNumber);
											}}>
											{pageNumber}
										</PaginationLink>
									</PaginationItem>
								),
							)}

							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (page < totalPages) setPage(page + 1);
									}}
									className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>

			<div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
				{systemMetrics.map((metric, idx) => {
					const Icon = metric.icon;
					return (
						<div
							key={idx}
							className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between">
							<div className="flex items-start justify-between">
								<span className="text-sm font-medium text-slate-500">
									{metric.title}
								</span>
								<div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-icon-default shrink-0">
									<Icon className="w-4 h-4 text-icon-default" />
								</div>
							</div>
							<div className="mt-4">
								<span className="text-3xl font-bold tracking-tight text-slate-900">
									{metric.value}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}