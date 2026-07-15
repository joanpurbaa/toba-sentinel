// ==================================================
// app/dashboard/stok-barang/page.tsx
// ==================================================
"use client";

import React, { useEffect, useState } from "react";
import {
	SearchIcon,
	PlusIcon,
	PackagePlusIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	AlertCircleIcon,
	ClockIcon,
	SnowflakeIcon,
	ShieldAlertIcon,
	PencilIcon,
	Trash2Icon,
	Eye,
} from "lucide-react";
import AddItemModal from "@/components/modal/AddItemModal";
import ReceiveStockModal from "@/components/modal/ReceiveStockModal";
import ItemDetailModal from "@/components/modal/ItemDetailModal";
import type { ApiItem } from "@/app/types/StokBarang";
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStokBarangStore } from "@/store/useStokBarangStore";

const statusLabel: Record<ApiItem["status"], string> = {
	AMAN: "Aman",
	MENIPIS: "Menipis",
	KRITIS: "Kritis",
	PENDING: "Menunggu barang masuk",
};

const statusStyle: Record<ApiItem["status"], string> = {
	AMAN: "bg-primary/10 text-primary border border-primary/20",
	MENIPIS: "bg-amber-50 text-amber-700 border border-amber-100",
	KRITIS: "bg-red-50 text-red-700 border border-red-100",
	PENDING: "bg-slate-100 text-slate-700 border border-slate-200",
};

function formatRelativeTime(dateString: string) {
	const diffMs = Date.now() - new Date(dateString).getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours} jam yang lalu`;
	const diffDays = Math.floor(diffHours / 24);
	return `${diffDays} hari yang lalu`;
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function storageIcon(condition: ApiItem["storageCondition"]) {
	if (condition === "DINGIN" || condition === "BEKU") {
		return (
			<span
				title={condition === "DINGIN" ? "Cold Chain (2-8°C)" : "Beku"}
				className="inline-flex items-center justify-center w-5 h-5 rounded bg-sky-50 border border-sky-100">
				<SnowflakeIcon className="w-3 h-3 text-sky-600" />
			</span>
		);
	}
	return null;
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

export default function StokBarang() {
	const items = useStokBarangStore((state) => state.items);
	const pagination = useStokBarangStore((state) => state.pagination);
	const page = useStokBarangStore((state) => state.page);
	const setPage = useStokBarangStore((state) => state.setPage);
	const pageSize = useStokBarangStore((state) => state.pageSize);
	const setPageSize = useStokBarangStore((state) => state.setPageSize);
	const isLoading = useStokBarangStore((state) => state.isLoading);
	const searchQuery = useStokBarangStore((state) => state.searchQuery);
	const setSearchQuery = useStokBarangStore((state) => state.setSearchQuery);
	const categoryFilter = useStokBarangStore((state) => state.categoryFilter);
	const setCategoryFilter = useStokBarangStore(
		(state) => state.setCategoryFilter,
	);
	const statusFilter = useStokBarangStore((state) => state.statusFilter);
	const setStatusFilter = useStokBarangStore((state) => state.setStatusFilter);
	const fetchItems = useStokBarangStore((state) => state.fetchItems);

	// State untuk modal tambah
	const [isAddItemOpen, setIsAddItemOpen] = useState(false);
	// State untuk terima barang
	const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
	// State untuk detail item
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

	// State untuk edit dan hapus
	const [editTarget, setEditTarget] = useState<ApiItem | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(fetchItems, 300);
		return () => clearTimeout(timeout);
	}, [searchQuery, categoryFilter, statusFilter, page, pageSize, fetchItems]);

	const rangeStart =
		pagination && pagination.totalItems > 0
			? (pagination.page - 1) * pagination.pageSize + 1
			: 0;
	const rangeEnd = pagination
		? Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
		: 0;

	// Fungsi hapus item
	const handleDelete = async () => {
		if (!deleteTargetId) return;
		setIsDeleting(true);
		setDeleteError(null);
		try {
			// ⚠️ Ganti route fetch jadi query param agar sesuai dengan 1 file /api/items
			const res = await fetch(`/api/items?id=${deleteTargetId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) {
				setDeleteError(data.error ?? "Gagal menghapus item");
				return;
			}
			// Sukses, refresh daftar dan tutup dialog
			setDeleteTargetId(null);
			fetchItems();
		} catch {
			setDeleteError("Terjadi kesalahan jaringan");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h1 className="text-xl font-bold tracking-tight text-foreground">
						Stok Barang
					</h1>
					<p className="text-sm text-muted-foreground font-medium">
						Mengelola dan memantau stok barang
					</p>
				</div>

				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-icon-default" />
					<input
						type="text"
						placeholder="Cari SKU atau nama item..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
					/>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-end">
				<div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
					<div className="flex flex-col space-y-1.5 w-full sm:w-44">
						<label className="text-xs font-medium text-slate-500">Kategori</label>
						<div className="relative">
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
								<option>Semua Kategori</option>
								<option>Farmasi</option>
								<option>Alat Medis</option>
								<option>Konsumsi</option>
							</select>
							<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						</div>
					</div>

					<div className="flex flex-col space-y-1.5 w-full sm:w-44">
						<label className="text-xs font-medium text-slate-500">Status Stok</label>
						<div className="relative">
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
								<option>Semua Status</option>
								<option>Aman</option>
								<option>Menipis</option>
								<option>Kritis</option>
							</select>
							<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
					<button
						onClick={() => setIsReceiveStockOpen(true)}
						className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors whitespace-nowrap w-full lg:w-auto cursor-pointer">
						<PackagePlusIcon className="w-4 h-4" />
						Terima Barang Masuk
					</button>
					<button
						onClick={() => setIsAddItemOpen(true)}
						className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg shadow-sm transition-colors whitespace-nowrap w-full lg:w-auto">
						<PlusIcon className="w-4 h-4" />
						Tambah Item Baru
					</button>
				</div>
			</div>

			<div className="bg-white border border-t rounded-xl overflow-hidden flex flex-col justify-between">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[980px]">
						<thead>
							<tr className="bg-muted/40 border-b border-muted/20 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								<th className="px-6 py-3.5">Nama Item</th>
								<th className="px-6 py-3.5">Kode SKU</th>
								<th className="px-6 py-3.5">Kategori</th>
								<th className="px-6 py-3.5">Stok Saat Ini</th>
								<th className="px-6 py-3.5">Status</th>
								<th className="px-6 py-3.5">Kadaluarsa Terdekat</th>
								<th className="px-6 py-3.5">Update Terakhir</th>
								<th className="px-6 py-3.5 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
							{isLoading && (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Memuat data...
									</td>
								</tr>
							)}

							{!isLoading && items.length === 0 && (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Belum ada item yang cocok dengan filter ini.
									</td>
								</tr>
							)}

							{!isLoading &&
								items.map((item) => (
									<tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-1.5">
												<span className="font-semibold text-slate-900">{item.name}</span>
												{storageIcon(item.storageCondition)}
												{item.isControlledSubstance && (
													<span title="Golongan Narkotika/Psikotropika">
														<ShieldAlertIcon className="w-3.5 h-3.5 text-purple-500" />
													</span>
												)}
											</div>
											<div className="text-xs text-slate-400 mt-0.5">
												{item.description}
											</div>
										</td>

										<td className="px-6 py-4 font-mono text-xs text-slate-500 tracking-tight">
											{item.sku}
										</td>

										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${
													item.category === "Farmasi"
														? "bg-purple-50 text-purple-700 border border-purple-100/50"
														: item.category === "Alat Medis"
															? "bg-secondary/10 text-secondary border border-secondary/20"
															: "bg-slate-100 text-slate-700"
												}`}>
												{item.category}
											</span>
										</td>

										<td className="px-6 py-4 text-slate-900">
											<span className="text-base font-bold">{item.quantity}</span>{" "}
											<span className="text-xs text-slate-400 ml-0.5">{item.unit}</span>
										</td>

										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle[item.status]}`}>
												{item.status === "AMAN" && (
													<CheckCircle2Icon className="w-3.5 h-3.5 text-primary" />
												)}
												{item.status === "MENIPIS" && (
													<AlertTriangleIcon className="w-3.5 h-3.5 text-destructive" />
												)}
												{item.status === "KRITIS" && (
													<AlertCircleIcon className="w-3.5 h-3.5 text-red-600" />
												)}
												{statusLabel[item.status]}
											</span>
										</td>

										<td className="px-6 py-4">
											{item.nearestExpiry ? (
												<span
													className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
														item.isExpiringSoon
															? "bg-orange-50 text-orange-700 border border-orange-100"
															: "bg-slate-50 text-slate-500 border border-slate-100"
													}`}>
													{item.isExpiringSoon && <ClockIcon className="w-3.5 h-3.5" />}
													{formatDate(item.nearestExpiry)}
												</span>
											) : (
												<span className="text-xs text-slate-300">—</span>
											)}
										</td>

										<td className="px-6 py-4 text-xs text-slate-400 font-medium">
											{formatRelativeTime(item.updatedAt)}
										</td>

										<td className="px-6 py-4 text-center">
											<div className="inline-flex items-center gap-1">
												<button
													onClick={() => setSelectedItemId(item.id)}
													className="inline-flex items-center p-1.5 text-icon-default hover:bg-slate-100 rounded-lg transition-colors">
													<Eye className="w-4 h-4 cursor-pointer" />
												</button>
												<button
													onClick={() => setEditTarget(item)}
													className="inline-flex items-center p-1.5 text-icon-default hover:bg-slate-100 rounded-lg transition-colors"
													title="Edit Item">
													<PencilIcon className="w-4 h-4 cursor-pointer" />
												</button>
												<button
													onClick={() => {
														setDeleteError(null);
														setDeleteTargetId(item.id);
													}}
													className="inline-flex items-center p-1.5 text-icon-warning hover:bg-red-50 rounded-lg transition-colors"
													title="Hapus Item">
													<Trash2Icon className="w-4 h-4 cursor-pointer" />
												</button>
											</div>
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
									item
								</>
							) : (
								<>
									Menampilkan{" "}
									<span className="font-bold text-slate-700">{items.length}</span> item
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

			{isAddItemOpen && (
				<AddItemModal
					isOpen={isAddItemOpen}
					onClose={() => setIsAddItemOpen(false)}
					onSuccess={fetchItems}
				/>
			)}

			{editTarget && (
				<AddItemModal
					isOpen={editTarget !== null}
					onClose={() => setEditTarget(null)}
					onSuccess={() => {
						setEditTarget(null);
						fetchItems();
					}}
					editData={editTarget}
				/>
			)}

			{isReceiveStockOpen && (
				<ReceiveStockModal
					onClose={() => setIsReceiveStockOpen(false)}
					onSuccess={fetchItems}
				/>
			)}

			{selectedItemId && (
				<ItemDetailModal
					itemId={selectedItemId}
					onClose={() => setSelectedItemId(null)}
				/>
			)}

			<AlertDialog
				open={deleteTargetId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTargetId(null);
						setDeleteError(null);
					}
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Data item beserta seluruh batch stok
							yang terkait akan dihapus permanen.
						</AlertDialogDescription>
						{deleteError && (
							<div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg mt-2 font-medium">
								{deleteError}
							</div>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={isDeleting}>
							{isDeleting ? "Menghapus..." : "Ya, Hapus"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
