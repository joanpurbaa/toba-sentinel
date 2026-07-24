"use client";

import React, { useEffect, useState } from "react";
import { XIcon, ChevronDownIcon } from "lucide-react";
import type { ApiPlace } from "@/app/types/Tempat";

interface AddPlaceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	editData?: ApiPlace | null;
}

export default function AddPlaceModal({
	isOpen,
	onClose,
	onSuccess,
	editData,
}: AddPlaceModalProps) {
	const initialFormData = {
		name: "",
		category: "WISATA",
		subtype: "",
		priceMin: "",
		priceMax: "",
		mapsLink: "",
		address: "",
		operationalHour: "",
		facilitiesOrActivities: "",
		description: "",
	};

	const [formData, setFormData] = useState(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		if (editData) {
			setFormData({
				name: editData.name,
				category: editData.category,
				subtype: editData.subtype ?? "",
				priceMin: editData.priceMin !== null ? String(editData.priceMin) : "",
				priceMax: editData.priceMax !== null ? String(editData.priceMax) : "",
				mapsLink: "",
				address: editData.address ?? "",
				operationalHour: editData.operationalHour ?? "",
				facilitiesOrActivities: editData.facilitiesOrActivities ?? "",
				description: editData.description ?? "",
			});
		} else {
			setFormData(initialFormData);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, editData]);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrorMessage(null);

		const payload: Record<string, any> = { ...formData };
		if (editData) payload.id = editData.id;

		try {
			const method = editData ? "PATCH" : "POST";
			const response = await fetch("/api/admin/places", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				setErrorMessage(data.error ?? "Gagal menyimpan tempat");
				return;
			}

			if (!editData) setFormData(initialFormData);
			onSuccess?.();
			onClose();
		} catch {
			setErrorMessage("Terjadi kesalahan jaringan");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

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
							{editData ? "Edit Tempat" : "Tambah Tempat Baru"}
						</h2>
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

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">
							Nama Tempat <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="name"
							required
							value={formData.name}
							onChange={handleInputChange}
              placeholder="Contoh: Sipiso piso"
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Kategori <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<select
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
									<option value="WISATA">Wisata</option>
									<option value="HOTEL">Hotel</option>
									<option value="RESTO">Resto</option>
								</select>
								<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
							</div>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">Subtipe</label>
							<input
								type="text"
								name="subtype"
								value={formData.subtype}
								onChange={handleInputChange}
                placeholder="Contoh: Air Terjun"
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">Harga Min</label>
							<input
								type="number"
								name="priceMin"
								value={formData.priceMin}
								onChange={handleInputChange}
                placeholder="Contoh: 500.000"
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">Harga Max</label>
							<input
								type="number"
								name="priceMax"
								value={formData.priceMax}
								onChange={handleInputChange}
                placeholder="Contoh: 2.000.000"
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">
							Link Google Maps {!editData && <span className="text-red-500">*</span>}
						</label>
						<input
							type="text"
							name="mapsLink"
							required={!editData}
							placeholder="Tempel link Bagikan dari Google Maps"
							value={formData.mapsLink}
							onChange={handleInputChange}
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
						{editData &&
							editData.latitude !== null &&
							editData.longitude !== null && (
								<p className="text-[11px] text-slate-400">
									Koordinat saat ini: {editData.latitude.toFixed(6)},{" "}
									{editData.longitude.toFixed(6)}. Kosongkan jika tidak ingin mengubah
									lokasi.
								</p>
							)}
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">Alamat</label>
						<input
							type="text"
							name="address"
							value={formData.address}
							onChange={handleInputChange}
              placeholder="Contoh: Jl.Kenanga No 1"
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">
							Jam Operasional
						</label>
						<input
							type="text"
							name="operationalHour"
							value={formData.operationalHour}
							onChange={handleInputChange}
              placeholder="Contoh: 09:00"
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">
							Fasilitas / Aktivitas
						</label>
						<input
							type="text"
							name="facilitiesOrActivities"
							value={formData.facilitiesOrActivities}
							onChange={handleInputChange}
              placeholder="Contoh: Permandian air hangat"
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
					</div>

					<div className="flex flex-col space-y-1">
						<label className="text-xs font-semibold text-slate-500">Deskripsi</label>
						<textarea
							name="description"
							rows={2}
							value={formData.description}
							onChange={handleInputChange}
              placeholder="Contoh: Permandian air panas belerang"
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
							disabled={isSubmitting}
							className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg shadow-sm transition-colors disabled:opacity-50">
							{isSubmitting
								? "Menyimpan..."
								: editData
									? "Simpan Perubahan"
									: "Simpan Tempat"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
