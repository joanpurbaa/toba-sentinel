"use client";

import React, { useEffect, useState } from "react";
import {
	SearchIcon,
	PlusIcon,
	MapPinIcon,
	PhoneIcon,
	Trash2Icon,
	PencilIcon,
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
import AddDestinationModal from "@/components/modal/AddDestinationModal";
import { useMitraStore } from "@/store/useMitraStore";
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

export default function Mitra() {
	const {
		destinations,
		pagination,
		searchQuery,
		page,
		pageSize,
		isLoading,
		deleteTargetId,
		deleteError,
		setSearchQuery,
		setPage,
		setPageSize,
		setDeleteTargetId,
		setDeleteError,
		fetchDestinations,
		deleteMitra,
	} = useMitraStore();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<{
		id: string;
		name: string;
		address: string | null;
		phone: string | null;
	} | null>(null);

	useEffect(() => {
		const timeout = setTimeout(fetchDestinations, 300);
		return () => clearTimeout(timeout);
	}, [searchQuery, page, pageSize, fetchDestinations]);

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6 bg-slate-50/50">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h1 className="text-xl font-bold tracking-tight text-foreground">Mitra</h1>
					<p className="text-sm text-muted-foreground font-medium">
						Pendataan mitra baik klinik, puskesmas, atau rumah sakit
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
					<div className="relative w-full sm:w-64">
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-icon-default" />
						<input
							type="text"
							placeholder="Cari nama klinik atau alamat..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 transition-all"
						/>
					</div>

					<button
						onClick={() => setIsModalOpen(true)}
						className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg shadow-sm transition-colors whitespace-nowrap">
						<PlusIcon className="w-4 h-4 text-white" />
						Tambah Mitra Baru
					</button>
				</div>
			</div>

			<div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto w-full">
					<table className="w-full text-left border-collapse min-w-[800px]">
						<thead>
							<tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
								<th className="px-6 py-3.5">Nama Mitra / Klinik</th>
								<th className="px-6 py-3.5">Alamat Lengkap</th>
								<th className="px-6 py-3.5">No. Telepon / Kontak</th>
								<th className="px-6 py-3.5">Status Lokasi (GPS)</th>
								<th className="px-6 py-3.5 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
							{isLoading && (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Memuat data mitra...
									</td>
								</tr>
							)}

							{!isLoading && destinations.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-8 text-center text-sm text-slate-400">
										Belum ada data klinik yang terdaftar.
									</td>
								</tr>
							)}

							{!isLoading &&
								destinations.map((mitra) => (
									<tr key={mitra.id} className="hover:bg-slate-50/40 transition-colors">
										<td className="px-6 py-4">
											<div className="font-semibold text-slate-900">{mitra.name}</div>
										</td>
										<td className="px-6 py-4 max-w-xs truncate text-slate-500">
											{mitra.address ? (
												<div className="flex items-center gap-1.5">
													<MapPinIcon className="w-3.5 h-3.5 text-icon-default shrink-0" />
													<span className="truncate">{mitra.address}</span>
												</div>
											) : (
												<span className="text-slate-300">—</span>
											)}
										</td>
										<td className="px-6 py-4 text-slate-500">
											{mitra.phone ? (
												<div className="flex items-center gap-1.5">
													<PhoneIcon className="w-3.5 h-3.5 text-icon-default shrink-0" />
													<span>{mitra.phone}</span>
												</div>
											) : (
												<span className="text-slate-300">—</span>
											)}
										</td>
										<td className="px-6 py-4">
											{mitra.latitude !== null && mitra.longitude !== null ? (
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary border border-primary">
													Koordinat Terbaca
												</span>
											) : (
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
													Belum Di-plot
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="inline-flex items-center gap-1">
												<button
													onClick={() =>
														setEditTarget({
															id: mitra.id,
															name: mitra.name,
															address: mitra.address,
															phone: mitra.phone,
														})
													}
													className="inline-flex items-center p-1.5 text-icon-default hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
													title="Edit Mitra">
													<PencilIcon className="w-4 h-4" />
												</button>
												<button
													onClick={() => {
														setDeleteError(null);
														setDeleteTargetId(mitra.id);
													}}
													className="inline-flex items-center p-1.5 text-icon-warning hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
													title="Hapus Mitra">
													<Trash2Icon className="w-4 h-4" />
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
							Menampilkan{" "}
							<span className="font-bold text-slate-700">{destinations.length}</span>{" "}
							dari{" "}
							<span className="font-bold text-slate-700">
								{pagination?.totalItems ?? 0}
							</span>{" "}
							mitra
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

			<AddDestinationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={() => {
					fetchDestinations();
				}}
			/>

			<AddDestinationModal
				isOpen={editTarget !== null}
				onClose={() => setEditTarget(null)}
				onSuccess={() => {
					fetchDestinations();
				}}
				editData={editTarget}
			/>

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
						<AlertDialogTitle>Hapus data mitra ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak bisa dibatalkan. Data mitra akan dihapus secara
							permanen dari sistem.
						</AlertDialogDescription>
						{deleteError && (
							<div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg mt-2 font-medium">
								{deleteError}
							</div>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="cursor-pointer" disabled={isLoading}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								if (deleteTargetId) deleteMitra(deleteTargetId);
							}}>
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
