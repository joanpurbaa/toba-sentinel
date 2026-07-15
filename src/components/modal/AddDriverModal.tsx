"use client";

import { useEffect, useState } from "react";
import { XIcon, ChevronDownIcon } from "lucide-react";

interface AddDriverModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

interface VehicleOption {
	id: string;
	plat: string;
	model: string;
}

const initialFormData = {
	name: "",
	simNumber: "",
	simType: "SIM A",
	phone: "",
	status: "AKTIF",
	usualVehicleId: "",
};

export default function AddDriverModal({
	isOpen,
	onClose,
	onSuccess,
}: AddDriverModalProps) {
	const [formData, setFormData] = useState(initialFormData);
	const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		fetch("/api/vehicles")
			.then((r) => r.json())
			.then((data) => setVehicles(data.vehicles ?? []));
	}, [isOpen]);

	if (!isOpen) return null;

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrorMessage(null);
		try {
			const response = await fetch("/api/drivers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					usualVehicleId: formData.usualVehicleId || null,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				setErrorMessage(data.error ?? "Gagal menyimpan sopir");
				return;
			}
			setFormData(initialFormData);
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
							Tambah Sopir Baru
						</h2>
						<p className="text-xs text-slate-400 font-medium mt-0.5">
							Daftarkan sopir baru ke data petugas gudang.
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
							Nama Lengkap <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="name"
							required
							placeholder="Contoh: Asep Saputra"
							value={formData.name}
							onChange={handleInputChange}
							className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Nomor SIM <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="simNumber"
								required
								placeholder="Contoh: 12390123"
								value={formData.simNumber}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Jenis SIM <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<select
									name="simType"
									value={formData.simType}
									onChange={handleInputChange}
									className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
									<option value="SIM A">SIM A</option>
									<option value="SIM B1">SIM B1</option>
									<option value="SIM B2">SIM B2</option>
								</select>
								<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">
								Nomor Telepon <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="phone"
								required
								placeholder="Contoh: 0812-990-1234"
								value={formData.phone}
								onChange={handleInputChange}
								className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-800"
							/>
						</div>
						<div className="flex flex-col space-y-1">
							<label className="text-xs font-semibold text-slate-500">Status</label>
							<div className="relative">
								<select
									name="status"
									value={formData.status}
									onChange={handleInputChange}
									className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
									<option value="AKTIF">Aktif</option>
									<option value="CUTI">Cuti</option>
									<option value="NONAKTIF">Nonaktif</option>
								</select>
								<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
							</div>
						</div>
					</div>

					<div className="flex flex-col space-y-1 border-t border-slate-100 pt-3">
						<label className="text-xs font-semibold text-slate-500">
							Kendaraan yang Biasa Ditugaskan (opsional)
						</label>
						<div className="relative">
							<select
								name="usualVehicleId"
								value={formData.usualVehicleId}
								onChange={handleInputChange}
								className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-700 pr-9">
								<option value="">Belum ditentukan</option>
								{vehicles.map((v) => (
									<option key={v.id} value={v.id}>
										{v.plat} — {v.model}
									</option>
								))}
							</select>
							<ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
						</div>
						<p className="text-[11px] text-slate-400 mt-0.5">
							Ini cuma referensi tampilan, bukan aturan tetap — tiap pengiriman tetap
							bisa pilih kendaraan lain.
						</p>
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
							{isSubmitting ? "Menyimpan..." : "Simpan Sopir"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
