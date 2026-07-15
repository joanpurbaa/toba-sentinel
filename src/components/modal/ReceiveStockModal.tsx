"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { XIcon, SearchIcon, Check, ChevronsUpDown } from "lucide-react";

interface ItemOption {
	id: string;
	name: string;
	sku: string;
}

interface ReceiveStockModalProps {
	onClose: () => void;
	onSuccess?: () => void;
	presetItem?: ItemOption | null;
}

const initialFormData = {
	batchNumber: "",
	expiryDate: "",
	quantityReceived: "",
	vendorName: "",
	note: "",
};

export default function ReceiveStockModal({
	onClose,
	onSuccess,
	presetItem = null,
}: ReceiveStockModalProps) {
	const [selectedItem, setSelectedItem] = useState<ItemOption | null>(
		presetItem,
	);
	const [itemSearch, setItemSearch] = useState("");
	const [searchResults, setSearchResults] = useState<ItemOption[]>([]);
	const [showResults, setShowResults] = useState(false);

	const [formData, setFormData] = useState(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	const resetForm = useCallback(() => {
		setFormData(initialFormData);
		setSelectedItem(presetItem);
		setItemSearch("");
		setSearchResults([]);
		setShowResults(false);
		setErrorMessage(null);
		setIsSubmitting(false);
	}, [presetItem]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowResults(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (!itemSearch) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSearchResults([]);
			return;
		}

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/items?search=${encodeURIComponent(itemSearch)}`,
				);
				const data = await response.json();
				setSearchResults(data.items ?? []);
			} catch {
				setSearchResults([]);
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [itemSearch]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const isExpiryTooSoon =
		formData.expiryDate && new Date(formData.expiryDate) < new Date();

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedItem) return;
		setIsSubmitting(true);
		setErrorMessage(null);
		try {
			const response = await fetch(`/api/items/${selectedItem.id}/batches`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				setErrorMessage(data.error ?? "Gagal menyimpan barang masuk");
				return;
			}

			resetForm();
			onSuccess?.();
			onClose();
		} catch {
			setErrorMessage("Terjadi kesalahan jaringan");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			/>

			<div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
					<div>
						<h2 className="text-base font-semibold text-slate-900">
							Terima Barang Masuk
						</h2>
						<p className="text-xs text-slate-400 font-medium mt-0.5">
							Pilih item yang sudah di-setup sebagai pending, lalu catat batch barang
							yang sudah tiba di gudang.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
						<XIcon className="w-4 h-4 cursor-pointer" />
					</button>
				</div>

				<form
					onSubmit={handleFormSubmit}
					className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
					{errorMessage && (
						<div className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">
							{errorMessage}
						</div>
					)}

					{!presetItem && (
						<div className="flex flex-col space-y-1" ref={dropdownRef}>
							<label className="text-xs font-semibold text-slate-500">
								Item <span className="text-red-500">*</span>
							</label>

							<div className="relative">
								<button
									type="button"
									onClick={() => setShowResults(!showResults)}
									className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all">
									{selectedItem ? (
										<span className="truncate font-medium">
											{selectedItem.name}{" "}
											<span className="text-xs font-mono text-slate-400">
												({selectedItem.sku})
											</span>
										</span>
									) : (
										<span className="text-slate-400">Pilih item...</span>
									)}
									<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-slate-500" />
								</button>

								{showResults && (
									<div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
										<div className="flex items-center border-b border-slate-100 px-3">
											<SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50 text-icon-default" />
											<input
												type="text"
												placeholder="Cari SKU atau nama item..."
												value={itemSearch}
												onChange={(e) => setItemSearch(e.target.value)}
												className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
											/>
										</div>
										<div className="max-h-48 overflow-y-auto p-1">
											{searchResults.map((item) => (
												<button
													type="button"
													key={item.id}
													onClick={() => {
														setSelectedItem(item);
														setShowResults(false);
														setItemSearch("");
													}}
													className="relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm text-slate-800 outline-none hover:bg-slate-50 transition-colors text-left">
													<div className="flex flex-col flex-1 min-w-0 pr-6">
														<span className="font-medium truncate text-slate-800">
															{item.name}
														</span>
														<span className="text-xs font-mono text-slate-400 mt-0.5">
															{item.sku}
														</span>
													</div>
													{selectedItem?.id === item.id && (
														<Check className="absolute right-2 h-4 w-4 text-slate-800" />
													)}
												</button>
											))}
											{itemSearch && searchResults.length === 0 && (
												<div className="py-6 text-center text-xs text-slate-400">
													Item tidak ditemukan. Daftarkan lewat &quot;Tambah Item Baru&quot;
													dulu.
												</div>
											)}
											{!itemSearch && (
												<div className="py-4 text-center text-xs text-slate-400">
													Ketik untuk mulai mencari produk...
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Nomor Batch <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="batchNumber"
								required
								placeholder="Contoh: PRC-2027-06"
								value={formData.batchNumber}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Tanggal Kadaluarsa <span className="text-red-500">*</span>
							</label>
							<input
								type="date"
								name="expiryDate"
								required
								value={formData.expiryDate}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
							{isExpiryTooSoon && (
								<p className="text-[11px] text-red-500 mt-0.5">
									Tanggal ini sudah lewat — periksa kembali sebelum disimpan.
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Jumlah Diterima <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								name="quantityReceived"
								required
								min="1"
								placeholder="0"
								value={formData.quantityReceived}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Vendor / Supplier
							</label>
							<input
								type="text"
								name="vendorName"
								placeholder="Contoh: Medika Jaya"
								value={formData.vendorName}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">
							Catatan (opsional)
						</label>
						<textarea
							name="note"
							rows={2}
							placeholder="Nomor PO, kondisi barang saat diterima, dll..."
							value={formData.note}
							onChange={handleInputChange}
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800 resize-none"
						/>
					</div>

					<div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer">
							Batal
						</button>
						<button
							type="submit"
							disabled={!selectedItem || isSubmitting}
							className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer">
							{isSubmitting ? "Menyimpan..." : "Simpan Barang Masuk"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
