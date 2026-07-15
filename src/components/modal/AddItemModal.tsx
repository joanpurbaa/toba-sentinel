// ==================================================
// components/modal/AddItemModal.tsx
// ==================================================
"use client";

import React, { useEffect, useState } from "react";
import { XIcon, ChevronDownIcon } from "lucide-react";
import type { ApiItem } from "@/app/types/StokBarang";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: ApiItem | null; // tambahan untuk mode edit
}

export default function AddItemModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: AddItemModalProps) {
  const initialFormData = {
    name: "",
    sku: "",
    categoryName: "Farmasi",
    unit: "Strip",
    description: "",
    minThreshold: "",
    criticalThreshold: "",
    expiryWarningDays: "90",
    storageCondition: "SUHU_RUANG",
    registrationNumber: "",
    isControlledSubstance: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Isi form jika dalam mode edit
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setFormData({
        name: editData.name,
        sku: editData.sku,
        categoryName: editData.category,
        unit: editData.unit,
        description: editData.description ?? "",
        minThreshold: String(editData.minThreshold ?? ""),
        criticalThreshold: String(editData.criticalThreshold ?? ""),
        expiryWarningDays: String(editData.expiryWarningDays ?? "90"),
        storageCondition: editData.storageCondition,
        registrationNumber: editData.registrationNumber ?? "",
        isControlledSubstance: editData.isControlledSubstance,
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
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Siapkan payload dasar
    const payload: Record<string, any> = {
      name: formData.name,
      sku: formData.sku,
      categoryName: formData.categoryName,
      unit: formData.unit,
      description: formData.description || null,
      minThreshold: formData.minThreshold ? parseInt(formData.minThreshold, 10) : 0,
      criticalThreshold: formData.criticalThreshold ? parseInt(formData.criticalThreshold, 10) : 0,
      expiryWarningDays: formData.expiryWarningDays ? parseInt(formData.expiryWarningDays, 10) : 90,
      storageCondition: formData.storageCondition,
      registrationNumber: formData.registrationNumber || null,
      isControlledSubstance: formData.isControlledSubstance,
    };

    // ⚠️ Jika mode edit, sisipkan id ke dalam JSON payload body
    if (editData) {
      payload.id = editData.id;
    }

    try {
      // Selalu tembak rute base '/api/items' karena menggunakan arsitektur 1 file
      const url = "/api/items";
      const method = editData ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? "Gagal menyimpan item");
        return;
      }

      // Reset form hanya untuk tambah baru
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
								{editData ? "Edit Item" : "Tambah Item Baru"}
							</h2>
							<p className="text-xs text-slate-400 font-medium mt-0.5">
								{editData
									? "Perbarui data master item. Stok tidak berubah."
									: 'Daftarkan SKU baru ke master data. Stok fisik diinput lewat "Terima Barang Masuk" setelah ini.'}
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

						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Nama Item <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="name"
								required
								placeholder="Contoh: Amoxicillin Syrup 60ml"
								value={formData.name}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Kode SKU <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="sku"
									required
									placeholder="Contoh: MED-AMX-60"
									value={formData.sku}
									onChange={handleInputChange}
									className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
								/>
							</div>
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Kategori <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<select
										name="categoryName"
										value={formData.categoryName}
										onChange={handleInputChange}
										className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
										<option value="Farmasi">Farmasi</option>
										<option value="Alat Medis">Alat Medis</option>
										<option value="Konsumsi">Konsumsi</option>
									</select>
									<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Satuan Unit <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<select
										name="unit"
										value={formData.unit}
										onChange={handleInputChange}
										className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
										<option value="Strip">Strip</option>
										<option value="Box">Box</option>
										<option value="Vial">Vial</option>
										<option value="Pcs">Pcs</option>
									</select>
									<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
								</div>
							</div>
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Kondisi Penyimpanan <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<select
										name="storageCondition"
										value={formData.storageCondition}
										onChange={handleInputChange}
										className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
										<option value="SUHU_RUANG">Suhu Ruang</option>
										<option value="DINGIN">Dingin (2-8°C)</option>
										<option value="BEKU">Beku</option>
									</select>
									<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Batas Menipis (Min)
								</label>
								<input
									type="number"
									name="minThreshold"
									min="0"
									placeholder="Contoh: 50"
									value={formData.minThreshold}
									onChange={handleInputChange}
									className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
								/>
							</div>
							<div className="flex flex-col space-y-1">
								<label className="text-xs font-semibold text-slate-500">
									Batas Kritis
								</label>
								<input
									type="number"
									name="criticalThreshold"
									min="0"
									placeholder="Contoh: 15"
									value={formData.criticalThreshold}
									onChange={handleInputChange}
									className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
								/>
							</div>
						</div>

						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Peringatan Mendekati Kadaluarsa (H- berapa hari)
							</label>
							<input
								type="number"
								name="expiryWarningDays"
								min="0"
								placeholder="Contoh: 90"
								value={formData.expiryWarningDays}
								onChange={handleInputChange}
								className="w-full sm:w-1/2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>

						<div className="flex flex-col space-y-1 border-t border-slate-100 pt-3">
							<label className="text-xs font-semibold text-slate-500">
								Nomor Izin Edar BPOM (opsional)
							</label>
							<input
								type="text"
								name="registrationNumber"
								placeholder="Contoh: DKL1234567890A1"
								value={formData.registrationNumber}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>

						<label className="flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								name="isControlledSubstance"
								checked={formData.isControlledSubstance}
								onChange={handleInputChange}
								className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10"
							/>
							<span className="text-xs font-medium text-slate-600">
								Golongan Narkotika/Psikotropika (butuh pencatatan khusus)
							</span>
						</label>

						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Deskripsi / Keterangan
							</label>
							<textarea
								name="description"
								rows={2}
								placeholder="Keterangan sediaan obat atau catatan tambahan..."
								value={formData.description}
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
								disabled={isSubmitting}
								className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:opacity-50">
								{isSubmitting
									? "Menyimpan..."
									: editData
										? "Simpan Perubahan"
										: "Simpan Item"}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
}