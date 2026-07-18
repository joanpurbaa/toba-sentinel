"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	SearchIcon,
	PlusIcon,
	ChevronDownIcon,
	MapPinIcon,
	HotelIcon,
	UtensilsIcon,
	LandmarkIcon,
	PencilIcon,
	Trash2Icon,
	Eye,
} from "lucide-react";
import AddPlaceModal from "@/components/modal/AddPlaceModal";
import type { ApiPlace } from "@/app/types/Tempat";
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
import { useTempatStore } from "@/store/useTempatStore";

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

export default function TempatPage() {
	const router = useRouter();
	const items = useTempatStore((state) => state.items);
	const pagination = useTempatStore((state) => state.pagination);
	const summary = useTempatStore((state) => state.summary);
	const page = useTempatStore((state) => state.page);
	const setPage = useTempatStore((state) => state.setPage);
	const pageSize = useTempatStore((state) => state.pageSize);
	const setPageSize = useTempatStore((state) => state.setPageSize);
	const isLoading = useTempatStore((state) => state.isLoading);
	const searchQuery = useTempatStore((state) => state.searchQuery);
	const setSearchQuery = useTempatStore((state) => state.setSearchQuery);
	const categoryFilter = useTempatStore((state) => state.categoryFilter);
	const setCategoryFilter = useTempatStore((state) => state.setCategoryFilter);
	const sortBy = useTempatStore((state) => state.sortBy);
	const setSortBy = useTempatStore((state) => state.setSortBy);
	const fetchItems = useTempatStore((state) => state.fetchItems);
	const fetchSummary = useTempatStore((state) => state.fetchSummary);

	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<ApiPlace | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(fetchItems, 300);
		return () => clearTimeout(timeout);
	}, [searchQuery, categoryFilter, sortBy, page, pageSize, fetchItems]);

	useEffect(() => {
		fetchSummary();
	}, [fetchSummary]);

	const rangeStart =
		pagination && pagination.totalItems > 0
			? (pagination.page - 1) * pagination.pageSize + 1
			: 0;
	const rangeEnd = pagination
		? Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
		: 0;

	const handleDelete = async () => {
		if (!deleteTargetId) return;
		setIsDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(`/api/admin/places?id=${deleteTargetId}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (!res.ok) {
				setDeleteError(data.error ?? "Gagal menghapus tempat");
				return;
			}
			setDeleteTargetId(null);
			fetchItems();
			fetchSummary();
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
						Data Tempat
					</h1>
					<p className="text-sm text-muted-foreground font-medium">
						Kelola destinasi, hotel, dan kuliner terdaftar
					</p>
				</div>

				<div className="relative w-full sm:w-72">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-icon-default" />
					<input
						type="text"
						placeholder="Cari nama atau alamat..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="p-5 bg-card border border-border border-t-4 border-t-primary rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Total Tempat
						</span>
						<div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
							<MapPinIcon className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.totalPlaces ?? "-"}
					</span>
				</div>
				<div className="p-5 bg-card border border-border border-t-4 border-t-primary rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Destinasi Wisata
						</span>
						<div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
							<LandmarkIcon className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.totalWisata ?? "-"}
					</span>
				</div>
				<div className="p-5 bg-card border border-border border-t-4 border-t-sky-500 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">Hotel</span>
						<div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
							<HotelIcon className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.totalHotel ?? "-"}
					</span>
				</div>
				<div className="p-5 bg-card border border-border border-t-4 border-t-amber-500 rounded-xl shadow-xs">
					<div className="flex items-start justify-between">
						<span className="text-sm font-medium text-muted-foreground">Resto</span>
						<div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
							<UtensilsIcon className="w-4 h-4" />
						</div>
					</div>
					<span className="text-3xl font-bold tracking-tight text-foreground mt-4 block">
						{summary?.totalResto ?? "-"}
					</span>
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
								<option value="WISATA">Wisata</option>
								<option value="HOTEL">Hotel</option>
								<option value="RESTO">Resto</option>
							</select>
							<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						</div>
					</div>

					<div className="flex flex-col space-y-1.5 w-full sm:w-56">
						<label className="text-xs font-medium text-slate-500">Urutkan</label>
						<div className="relative">
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 pr-9">
								<option value="terbaru">Terbaru Diperbarui</option>
								<option value="bermasalah">Paling Bermasalah</option>
								<option value="memuaskan">Paling Memuaskan</option>
							</select>
							<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						</div>
					</div>
				</div>

				<button
					onClick={() => setIsAddOpen(true)}
					className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg shadow-sm transition-colors whitespace-nowrap w-full lg:w-auto">
					<PlusIcon className="w-4 h-4" />
					Tambah Tempat
				</button>
			</div>

			<div className="bg-white border border-t rounded-xl overflow-hidden flex flex-col justify-between">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[980px]">
						<thead>
							<tr className="bg-muted/40 border-b border-muted/20 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								<th className="px-6 py-3.5">Nama Tempat</th>
								<th className="px-6 py-3.5">Kategori</th>
								<th className="px-6 py-3.5">Alamat</th>
								<th className="px-6 py-3.5">Koordinat</th>
								<th className="px-6 py-3.5">Rating</th>
								<th className="px-6 py-3.5">Skor Masalah</th>
								<th className="px-6 py-3.5">Pemilik</th>
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
										Belum ada tempat yang cocok dengan filter ini.
									</td>
								</tr>
							)}

							{!isLoading &&
								items.map((place) => (
									<tr
										key={place.id}
										onClick={() => router.push(`/tempat/${place.id}`)}
										className="hover:bg-slate-50/40 transition-colors cursor-pointer">
										<td className="px-6 py-4">
											<span className="font-semibold text-slate-900">{place.name}</span>
											<div className="text-xs text-slate-400 mt-0.5">
												{place.placeCode}
											</div>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${categoryStyle[place.category]}`}>
												{categoryLabel[place.category]}
											</span>
										</td>
										<td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate">
											{place.address ?? "-"}
										</td>
										<td className="px-6 py-4 font-mono text-xs text-slate-500">
											{place.latitude !== null && place.longitude !== null
												? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
												: "-"}
										</td>
										<td className="px-6 py-4 text-slate-900">
											{place.rating !== null ? place.rating.toFixed(1) : "-"}
										</td>
										<td className="px-6 py-4">
											{place.aiTotalMentions > 0 ? (
												<span
													className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
														(place.aiGapScore ?? 0) >= 0.6
															? "bg-red-50 text-red-700 border border-red-100"
															: (place.aiGapScore ?? 0) >= 0.3
																? "bg-amber-50 text-amber-700 border border-amber-100"
																: "bg-green-50 text-green-700 border border-green-100"
													}`}>
													{Math.round((place.aiGapScore ?? 0) * 100)}%
												</span>
											) : (
												<span className="text-xs text-slate-300">Belum ada data</span>
											)}
										</td>
										<td className="px-6 py-4 text-xs text-slate-500">
											{place.ownerName ?? "-"}
										</td>
										<td
											className="px-6 py-4 text-center"
											onClick={(e) => e.stopPropagation()}>
											<div className="inline-flex items-center gap-1">
												<button
													onClick={() => router.push(`/tempat/${place.id}`)}
													className="inline-flex items-center p-1.5 text-icon-default hover:bg-slate-100 rounded-lg transition-colors">
													<Eye className="w-4 h-4 cursor-pointer" />
												</button>
												<button
													onClick={() => setEditTarget(place)}
													className="inline-flex items-center p-1.5 text-icon-default hover:bg-slate-100 rounded-lg transition-colors"
													title="Edit Tempat">
													<PencilIcon className="w-4 h-4 cursor-pointer" />
												</button>
												<button
													onClick={() => {
														setDeleteError(null);
														setDeleteTargetId(place.id);
													}}
													className="inline-flex items-center p-1.5 text-icon-warning hover:bg-red-50 rounded-lg transition-colors"
													title="Hapus Tempat">
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

			{isAddOpen && (
				<AddPlaceModal
					isOpen={isAddOpen}
					onClose={() => setIsAddOpen(false)}
					onSuccess={() => {
						fetchItems();
						fetchSummary();
					}}
				/>
			)}

			{editTarget && (
				<AddPlaceModal
					isOpen={editTarget !== null}
					onClose={() => setEditTarget(null)}
					onSuccess={() => {
						setEditTarget(null);
						fetchItems();
						fetchSummary();
					}}
					editData={editTarget}
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
						<AlertDialogTitle>Hapus tempat ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Data ulasan dan laporan terkait
							tempat ini akan ikut terhapus.
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
