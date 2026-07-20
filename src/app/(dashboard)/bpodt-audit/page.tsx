"use client";

import React, { useEffect, useState } from "react";
import {
	SearchIcon,
	ChevronDownIcon,
	ShieldCheck,
	CheckCircle2,
	AlertTriangle,
	HelpCircle,
	Eye,
	FileCheck2,
} from "lucide-react";
import { useBpodtAuditStore } from "@/store/useBpodtAuditStore";
import BpodtAuditDetailModal from "@/components/modal/BpodtAuditDetailModal";
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

const categoryLabel: Record<string, string> = {
	WISATA: "Wisata",
	HOTEL: "Hotel",
	RESTO: "Resto",
};

const categoryStyle: Record<string, string> = {
	WISATA: "bg-primary/10 text-primary border border-primary/20",
	HOTEL: "bg-sky-50 text-sky-700 border border-sky-100",
	RESTO: "bg-amber-50 text-amber-700 border border-amber-100",
};

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

export default function BpodtAuditPage() {
	const items = useBpodtAuditStore((state) => state.items);
	const pagination = useBpodtAuditStore((state) => state.pagination);
	const summary = useBpodtAuditStore((state) => state.summary);
	const page = useBpodtAuditStore((state) => state.page);
	const setPage = useBpodtAuditStore((state) => state.setPage);
	const pageSize = useBpodtAuditStore((state) => state.pageSize);
	const setPageSize = useBpodtAuditStore((state) => state.setPageSize);
	const isLoading = useBpodtAuditStore((state) => state.isLoading);
	const searchQuery = useBpodtAuditStore((state) => state.searchQuery);
	const setSearchQuery = useBpodtAuditStore((state) => state.setSearchQuery);
	const categoryFilter = useBpodtAuditStore((state) => state.categoryFilter);
	const setCategoryFilter = useBpodtAuditStore(
		(state) => state.setCategoryFilter,
	);
	const bpodtStatusFilter = useBpodtAuditStore(
		(state) => state.bpodtStatusFilter,
	);
	const setBpodtStatusFilter = useBpodtAuditStore(
		(state) => state.setBpodtStatusFilter,
	);
	const fetchItems = useBpodtAuditStore((state) => state.fetchItems);

	const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

	useEffect(() => {
		const timeout = setTimeout(fetchItems, 300);
		return () => clearTimeout(timeout);
	}, [
		searchQuery,
		categoryFilter,
		bpodtStatusFilter,
		page,
		pageSize,
		fetchItems,
	]);

	const rangeStart =
		pagination && pagination.totalItems > 0
			? (pagination.page - 1) * pagination.pageSize + 1
			: 0;
	const rangeEnd = pagination
		? Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
		: 0;

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<ShieldCheck className="w-6 h-6 text-slate-800" />
						BPODT Compliance Auditor
					</h1>
					<p className="text-sm text-muted-foreground font-medium">
						Verifikasi kesesuaian dan keandalan data destinasi dengan standar BPODT
					</p>
				</div>

				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Cari nama, kode, atau alamat..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="p-5 bg-card border border-border border-t-4 border-t-slate-700 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Total Tempat
						</span>
						<div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
							<FileCheck2 className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.totalPlaces ?? "-"}
					</span>
				</div>

				<div className="p-5 bg-card border border-border border-t-4 border-t-green-500 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Sinkron (Valid)
						</span>
						<div className="p-2 rounded-lg bg-green-50 text-green-600 shrink-0">
							<CheckCircle2 className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.sinkronCount ?? "-"}
					</span>
				</div>

				<div className="p-5 bg-card border border-border border-t-4 border-t-red-500 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Tidak Sinkron
						</span>
						<div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
							<AlertTriangle className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.tidakSinkronCount ?? "-"}
					</span>
				</div>

				<div className="p-5 bg-card border border-border border-t-4 border-t-slate-400 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Belum Dicek
						</span>
						<div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
							<HelpCircle className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.belumDicekCount ?? "-"}
					</span>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-4 items-center">
				<div className="flex flex-col space-y-1.5 w-full sm:w-48">
					<label className="text-xs font-medium text-slate-500">Kategori</label>
					<div className="relative">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
							<option>Semua Kategori</option>
							<option value="WISATA">Wisata</option>
							<option value="HOTEL">Hotel</option>
							<option value="RESTO">Resto</option>
						</select>
						<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
					</div>
				</div>

				<div className="flex flex-col space-y-1.5 w-full sm:w-52">
					<label className="text-xs font-medium text-slate-500">Status BPODT</label>
					<div className="relative">
						<select
							value={bpodtStatusFilter}
							onChange={(e) => setBpodtStatusFilter(e.target.value)}
							className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
							<option>Semua Status</option>
							<option value="SINKRON">Sinkron</option>
							<option value="TIDAK_SINKRON">Tidak Sinkron</option>
							<option value="BELUM_DICEK">Belum Dicek</option>
						</select>
						<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
					</div>
				</div>
			</div>

			<div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[900px]">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
								<th className="px-6 py-3.5">Tempat</th>
								<th className="px-6 py-3.5">Kategori</th>
								<th className="px-6 py-3.5">Alamat</th>
								<th className="px-6 py-3.5">Indikasi Masalah</th>
								<th className="px-6 py-3.5">Status BPODT</th>
								<th className="px-6 py-3.5">Catatan Audit</th>
								<th className="px-6 py-3.5 text-center">Aksi Audit</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
							{isLoading && (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Memuat data audit...
									</td>
								</tr>
							)}

							{!isLoading && items.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Tidak ada tempat yang sesuai kriteria audit.
									</td>
								</tr>
							)}

							{!isLoading &&
								items.map((place) => (
									<tr key={place.id} className="hover:bg-slate-50/50 transition-colors">
										<td className="px-6 py-4">
											<span className="font-semibold text-slate-900 block">
												{place.name}
											</span>
											<span className="text-xs font-mono text-slate-400">
												{place.placeCode}
											</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${
													categoryStyle[place.category]
												}`}>
												{categoryLabel[place.category]}
											</span>
										</td>
										<td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
											{place.address ?? "-"}
										</td>
										<td className="px-6 py-4">
											{place.issuesCount > 0 ? (
												<div className="flex flex-col text-xs">
													<span className="font-semibold text-amber-700">
														{place.issuesCount} Kategori Masalah
													</span>
													<span className="text-slate-400 text-[11px]">
														{place.negativeReviewsCount} ulasan negatif
													</span>
												</div>
											) : (
												<span className="text-xs text-slate-400">Tidak ada</span>
											)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
													place.bpodtVerified === "SINKRON"
														? "bg-green-50 text-green-700 border border-green-100"
														: place.bpodtVerified === "TIDAK_SINKRON"
															? "bg-red-50 text-red-700 border border-red-100"
															: "bg-slate-100 text-slate-600 border border-slate-200"
												}`}>
												{place.bpodtVerified === "SINKRON"
													? "Sinkron"
													: place.bpodtVerified === "TIDAK_SINKRON"
														? "Tidak Sinkron"
														: "Belum Dicek"}
											</span>
										</td>
										<td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate">
											{place.bpodtNote ?? "-"}
										</td>
										<td className="px-6 py-4 text-center">
											<button
												onClick={() => setSelectedPlaceId(place.id)}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer">
												<Eye className="w-3.5 h-3.5" />
												Audit Detail
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>

				<div className="p-4 bg-white border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-4 order-2 lg:order-1">
						<span className="text-xs text-slate-500 font-medium text-center sm:text-left">
							{pagination && pagination.totalItems > 0 ? (
								<>
									Menampilkan{" "}
									<span className="font-bold text-slate-700">
										{rangeStart}-{rangeEnd}
									</span>{" "}
									dari{" "}
									<span className="font-bold text-slate-700">
										{pagination.totalItems}
									</span>{" "}
									tempat
								</>
							) : (
								<>
									Menampilkan{" "}
									<span className="font-bold text-slate-700">{items.length}</span> tempat
								</>
							)}
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
										if (pagination && pagination.page > 1) setPage(pagination.page - 1);
									}}
									className={
										!pagination || pagination.page <= 1
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>

							{pagination &&
								getPageNumbers(pagination.page, pagination.totalPages).map(
									(pageNumber, idx) =>
										pageNumber === "ellipsis" ? (
											<PaginationItem key={`ellipsis-${idx}`}>
												<PaginationEllipsis />
											</PaginationItem>
										) : (
											<PaginationItem key={pageNumber}>
												<PaginationLink
													href="#"
													isActive={pageNumber === pagination.page}
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
										if (pagination && pagination.page < pagination.totalPages)
											setPage(pagination.page + 1);
									}}
									className={
										!pagination || pagination.page >= pagination.totalPages
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>

			<BpodtAuditDetailModal
				placeId={selectedPlaceId}
				isOpen={selectedPlaceId !== null}
				onClose={() => setSelectedPlaceId(null)}
			/>
		</div>
	);
}
