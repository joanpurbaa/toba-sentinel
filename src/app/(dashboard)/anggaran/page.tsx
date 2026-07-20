"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
	SearchIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	XCircleIcon,
	WalletIcon,
	ChevronDownIcon,
} from "lucide-react";
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
import { useAnggaranStore } from "@/store/useAnggaranStore";

const ISSUE_LABEL: Record<string, string> = {
	PARKIR: "Parkir",
	TOILET: "Toilet",
	AKSES: "Akses Jalan",
	KEBERSIHAN: "Kebersihan",
	HARGA: "Harga",
	PELAYANAN: "Pelayanan",
	LAINNYA: "Lainnya",
};

const STATUS_LABEL: Record<string, string> = {
	MENUNGGU: "Menunggu",
	DISETUJUI: "Disetujui",
	DICAIRKAN: "Dicairkan",
	DITOLAK: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
	MENUNGGU: "bg-amber-50 text-amber-700 border-amber-100",
	DISETUJUI: "bg-blue-50 text-blue-700 border-blue-100",
	DICAIRKAN: "bg-green-50 text-green-700 border-green-100",
	DITOLAK: "bg-gray-50 text-gray-500 border-gray-100",
};

const FUNDING_LABEL: Record<string, string> = {
	APBD: "APBD",
	KEMENPAREKRAF: "Kemenparekraf",
};

interface Proposal {
	id: string;
	worstCategory: string;
	worstGapScore: number;
	urgencyScore: number;
	affectedUmkmCount: number;
	status: string;
	approvedAmount: number | null;
	fundingSource: string | null;
	notes: string | null;
	kabupaten: string;
	place: {
		id: string;
		name: string;
		placeCode: string;
		address: string | null;
		bpodtVerified?: boolean | null;
		bpodtNote?: string | null;
	};
	approvedBy: { name: string } | null;
}

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

export default function AnggaranPage() {
	const items = useAnggaranStore((state) => state.items);
	const pagination = useAnggaranStore((state) => state.pagination);
	const maxUrgency = useAnggaranStore((state) => state.maxUrgency);
	const availableKabupaten = useAnggaranStore(
		(state) => state.availableKabupaten,
	);
	const page = useAnggaranStore((state) => state.page);
	const setPage = useAnggaranStore((state) => state.setPage);
	const pageSize = useAnggaranStore((state) => state.pageSize);
	const setPageSize = useAnggaranStore((state) => state.setPageSize);
	const isLoading = useAnggaranStore((state) => state.isLoading);
	const searchQuery = useAnggaranStore((state) => state.searchQuery);
	const setSearchQuery = useAnggaranStore((state) => state.setSearchQuery);
	const categoryFilter = useAnggaranStore((state) => state.categoryFilter);
	const setCategoryFilter = useAnggaranStore((state) => state.setCategoryFilter);
	const kabupatenFilter = useAnggaranStore((state) => state.kabupatenFilter);
	const setKabupatenFilter = useAnggaranStore(
		(state) => state.setKabupatenFilter,
	);
	const fetchItems = useAnggaranStore((state) => state.fetchItems);

	const [modalTarget, setModalTarget] = useState<Proposal | null>(null);
	const [amount, setAmount] = useState("");
	const [fundingSource, setFundingSource] = useState("");
	const [notes, setNotes] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(fetchItems, 300);
		return () => clearTimeout(timeout);
	}, [searchQuery, categoryFilter, kabupatenFilter, page, pageSize, fetchItems]);

	const rangeStart =
		pagination && pagination.totalItems > 0
			? (pagination.page - 1) * pagination.pageSize + 1
			: 0;
	const rangeEnd = pagination
		? Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
		: 0;

	function urgencyOutOf10(score: number) {
		return ((score / maxUrgency) * 10).toFixed(1);
	}

	function openManage(p: Proposal) {
		setModalTarget(p);
		setAmount(p.approvedAmount !== null ? String(p.approvedAmount) : "");
		setFundingSource(p.fundingSource ?? "");
		setNotes(p.notes ?? "");
		setFormError(null);
	}

	async function submitDecision(status: "DISETUJUI" | "DITOLAK" | "DICAIRKAN") {
		if (!modalTarget) return;
		setFormError(null);

		if (status === "DISETUJUI") {
			if (!amount || Number(amount) <= 0) {
				setFormError("Nominal anggaran wajib diisi.");
				return;
			}
			if (!fundingSource) {
				setFormError("Pilih sumber dana terlebih dahulu.");
				return;
			}
		}

		setIsSubmitting(true);
		const res = await fetch(`/api/admin/budget-proposals/${modalTarget.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				status,
				approvedAmount: status === "DITOLAK" ? undefined : amount,
				fundingSource:
					status === "DITOLAK"
						? undefined
						: fundingSource || modalTarget.fundingSource,
				notes,
			}),
		});

		setIsSubmitting(false);

		if (!res.ok) {
			const data = await res.json().catch(() => null);
			setFormError(data?.error ?? "Gagal menyimpan.");
			return;
		}

		setModalTarget(null);
		fetchItems();
	}

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h1 className="text-xl font-bold tracking-tight text-foreground">
						Rekomendasi Prioritas Anggaran
					</h1>
					<p className="text-sm text-muted-foreground font-medium">
						Diurutkan berdasarkan skor urgensi. Hanya mencakup destinasi dengan data
						analisis AI.
					</p>
				</div>

				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-icon-default" />
					<input
						type="text"
						placeholder="Cari nama destinasi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
					/>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex flex-col space-y-1.5 w-full sm:w-52">
					<label className="text-xs font-medium text-slate-500">Kabupaten</label>
					<div className="relative">
						<select
							value={kabupatenFilter}
							onChange={(e) => setKabupatenFilter(e.target.value)}
							className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
							<option>Semua Kabupaten</option>
							{availableKabupaten.map((k) => (
								<option key={k} value={k}>
									{k}
								</option>
							))}
						</select>
						<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
					</div>
				</div>

				<div className="flex flex-col space-y-1.5 w-full sm:w-52">
					<label className="text-xs font-medium text-slate-500">
						Kategori Masalah
					</label>
					<div className="relative">
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
							<option>Semua Kategori</option>
							{Object.entries(ISSUE_LABEL).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
						<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
					</div>
				</div>
			</div>

			<div className="bg-white border border-t rounded-xl overflow-hidden flex flex-col justify-between">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[960px]">
						<thead>
							<tr className="bg-muted/40 border-b border-muted/20 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								<th className="px-6 py-3.5">Destinasi</th>
								<th className="px-6 py-3.5">Kabupaten</th>
								<th className="px-6 py-3.5">Audit BPODT</th>
								<th className="px-6 py-3.5">Aspek Masalah Utama</th>
								<th className="px-6 py-3.5">Skor Urgensi</th>
								<th className="px-6 py-3.5">UMKM Terdampak (2km)</th>
								<th className="px-6 py-3.5">Status</th>
								<th className="px-6 py-3.5 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
							{isLoading && (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Memuat data...
									</td>
								</tr>
							)}

							{!isLoading && items.length === 0 && (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Belum ada proposal yang cocok.
									</td>
								</tr>
							)}

							{!isLoading &&
								items.map((p) => (
									<tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-6 py-4">
											<Link
												href={`/tempat/${p.place.id}`}
												className="font-semibold text-slate-900 hover:text-primary hover:underline">
												{p.place.name}
											</Link>
											<div className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
												{p.place.address ?? "-"}
											</div>
										</td>
										<td className="px-6 py-4 text-xs text-slate-500">{p.kabupaten}</td>
										<td className="px-6 py-4 text-xs font-semibold">
											{p.place.bpodtVerified === false ? (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
													🚨 Tidak Sinkron
												</span>
											) : p.place.bpodtVerified === true ? (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
													✓ Valid
												</span>
											) : (
												<span className="text-slate-400 font-normal">Belum Dicek</span>
											)}
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-1.5">
												<AlertTriangleIcon className="w-3.5 h-3.5 text-red-500" />
												<span className="text-xs">
													{ISSUE_LABEL[p.worstCategory] ?? p.worstCategory} (
													{Math.round(p.worstGapScore * 100)}%)
												</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
													<div
														className="h-full bg-red-500"
														style={{ width: `${(p.urgencyScore / maxUrgency) * 100}%` }}
													/>
												</div>
												<span className="text-xs font-mono text-slate-500 whitespace-nowrap">
													{urgencyOutOf10(p.urgencyScore)} / 10
												</span>
											</div>
										</td>
										<td className="px-6 py-4 text-sm">
											{p.affectedUmkmCount > 0 ? (
												`${p.affectedUmkmCount} UMKM`
											) : (
												<span className="text-xs text-slate-400">
													Belum ada UMKM terdaftar sekitar
												</span>
											)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[p.status]}`}>
												{STATUS_LABEL[p.status]}
											</span>
										</td>
										<td className="px-6 py-4 text-center">
											<button
												onClick={() => openManage(p)}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors">
												<WalletIcon className="w-3.5 h-3.5" />
												Kelola
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
									proposal
								</>
							) : (
								<>
									Menampilkan{" "}
									<span className="font-bold text-slate-700">{items.length}</span>{" "}
									proposal
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

			{modalTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
						onClick={() => setModalTarget(null)}
					/>
					<div className="relative bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 p-5 space-y-4">
						<div>
							<h2 className="text-base font-semibold text-slate-900">
								{modalTarget.place.name}
							</h2>
							<p className="text-xs text-slate-400 mt-0.5">
								{ISSUE_LABEL[modalTarget.worstCategory]} · Urgensi{" "}
								{urgencyOutOf10(modalTarget.urgencyScore)} / 10 ·{" "}
								{modalTarget.affectedUmkmCount} UMKM sekitar
							</p>
						</div>

						{formError && (
							<div className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">
								{formError}
							</div>
						)}

						{modalTarget.status === "MENUNGGU" && (
							<>
								<div className="flex flex-col space-y-1">
									<label className="text-xs font-semibold text-slate-500">
										Nominal Anggaran (Rupiah) <span className="text-red-500">*</span>
									</label>
									<input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="Contoh: 50000000"
										className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
									/>
								</div>

								<div className="flex flex-col space-y-1">
									<label className="text-xs font-semibold text-slate-500">
										Sumber Dana <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<select
											value={fundingSource}
											onChange={(e) => setFundingSource(e.target.value)}
											className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
											<option value="">Pilih sumber dana...</option>
											<option value="APBD">APBD</option>
											<option value="KEMENPAREKRAF">Kemenparekraf</option>
										</select>
										<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
									</div>
								</div>

								<div className="flex flex-col space-y-1">
									<label className="text-xs font-semibold text-slate-500">
										Catatan Dinas
									</label>
									<textarea
										rows={3}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
									/>
								</div>

								<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
									<button
										onClick={() => submitDecision("DITOLAK")}
										disabled={isSubmitting}
										className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
										<XCircleIcon className="w-4 h-4" />
										Tolak
									</button>
									<button
										onClick={() => submitDecision("DISETUJUI")}
										disabled={isSubmitting}
										className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-secondary rounded-lg transition-colors">
										<CheckCircle2Icon className="w-4 h-4" />
										{isSubmitting ? "Menyimpan..." : "Setujui Anggaran"}
									</button>
								</div>
							</>
						)}

						{modalTarget.status === "DISETUJUI" && (
							<>
								<div className="text-sm text-slate-700 space-y-1 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
									<div>
										Nominal:{" "}
										<span className="font-semibold">
											Rp {Number(modalTarget.approvedAmount).toLocaleString("id-ID")}
										</span>
									</div>
									<div>
										Sumber Dana:{" "}
										<span className="font-semibold">
											{modalTarget.fundingSource
												? FUNDING_LABEL[modalTarget.fundingSource]
												: "-"}
										</span>
									</div>
								</div>
								<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
									<button
										onClick={() => submitDecision("DICAIRKAN")}
										disabled={isSubmitting}
										className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-secondary rounded-lg transition-colors">
										<WalletIcon className="w-4 h-4" />
										{isSubmitting ? "Memproses..." : "Cairkan Dana"}
									</button>
								</div>
							</>
						)}

						{(modalTarget.status === "DICAIRKAN" ||
							modalTarget.status === "DITOLAK") && (
							<div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
								Proposal ini sudah final ({STATUS_LABEL[modalTarget.status]}), tidak ada
								aksi lanjutan.
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
