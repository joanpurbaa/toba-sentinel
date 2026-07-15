"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

interface ShipmentEditData {
    id: string;
    itemId: string;
    quantity: number;
    destinationId: string;
    scheduledAt: string;
    driverId: string | null;
    vehicleId: string | null;
}

interface AddShipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: ShipmentEditData | null;
}

interface OptionItem {
    id: string;
    name: string;
    unit?: string;
}

interface OptionDestination {
    id: string;
    name: string;
}

interface OptionDriver {
    id: string;
    nama: string;
}

interface OptionVehicle {
    id: string;
    plat: string;
    model: string;
}

export default function AddShipmentModal({
    isOpen,
    onClose,
    onSuccess,
    editData,
}: AddShipmentModalProps) {
    const [items, setItems] = useState<OptionItem[]>([]);
    const [destinations, setDestinations] = useState<OptionDestination[]>([]);
    const [drivers, setDrivers] = useState<OptionDriver[]>([]);
    const [vehicles, setVehicles] = useState<OptionVehicle[]>([]);

    const [itemId, setItemId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [destinationId, setDestinationId] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [driverId, setDriverId] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        async function loadOptions() {
            setIsLoadingOptions(true);
            setError(null);
            try {
                const [itemsRes, destinationsRes, driversRes, vehiclesRes] =
                    await Promise.all([
                        fetch("/api/items?pageSize=100").then((r) => r.json()),
                        fetch("/api/destinations").then((r) => r.json()),
                        fetch("/api/drivers?pageSize=100").then((r) => r.json()),
                        fetch("/api/vehicles?pageSize=100").then((r) => r.json()),
                    ]);
                setItems(itemsRes.items ?? []);
                setDestinations(destinationsRes.destinations ?? []);
                setDrivers(driversRes.drivers ?? []);
                setVehicles(vehiclesRes.vehicles ?? []);
            } catch (err) {
                console.error("Failed to load options:", err);
                setError("Gagal memuat data master. Silakan tutup dan buka kembali modal ini.");
            } finally {
                setIsLoadingOptions(false);
            }
        }

        loadOptions();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);

        if (editData) {
            const date = new Date(editData.scheduledAt);
            setItemId(editData.itemId);
            setQuantity(String(editData.quantity));
            setDestinationId(editData.destinationId);
            setScheduledDate(date.toISOString().slice(0, 10));
            setScheduledTime(date.toTimeString().slice(0, 5));
            setDriverId(editData.driverId ?? "");
            setVehicleId(editData.vehicleId ?? "");
        } else {
            setItemId("");
            setQuantity("");
            setDestinationId("");
            setScheduledDate("");
            setScheduledTime("");
            setDriverId("");
            setVehicleId("");
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!itemId || !quantity || !destinationId || !scheduledDate || !scheduledTime) {
            setError("Item, jumlah, klinik tujuan, dan jadwal wajib diisi");
            return;
        }

        setIsSubmitting(true);
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        const payload = {
            itemId,
            quantity: Number(quantity),
            destinationId,
            scheduledAt,
            driverId: driverId || null,
            vehicleId: vehicleId || null,
        };

        try {
            const response = editData
                ? await fetch(`/api/distribusi/${editData.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                  })
                : await fetch("/api/distribusi", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                  });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Gagal menyimpan pengiriman");
                setIsSubmitting(false);
                return;
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Submit error:", err);
            setError("Terjadi kesalahan jaringan saat menyimpan data.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
						<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
							<div className="flex items-center justify-between p-5 border-b border-slate-100">
								<h2 className="text-base font-bold text-slate-900">
									{editData ? "Edit Pengiriman" : "Buat Pengiriman Baru"}
								</h2>
								<button
									onClick={onClose}
									className="text-slate-400 hover:text-slate-900 transition-colors">
									<XIcon className="w-5 h-5 cursor-pointer" />
								</button>
							</div>

							<form onSubmit={handleSubmit} className="p-5 space-y-4">
								{error && (
									<div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 animate-in slide-in-from-top-2">
										{error}
									</div>
								)}

								<div className="space-y-1.5">
									<label htmlFor="itemId" className="text-xs font-medium text-slate-500">
										Item
									</label>
									<select
										id="itemId"
										value={itemId}
										onChange={(e) => setItemId(e.target.value)}
										disabled={isLoadingOptions}
										className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50">
										<option value="">Pilih item</option>
										{items.map((item) => (
											<option key={item.id} value={item.id}>
												{item.name}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="quantity"
										className="text-xs font-medium text-slate-500">
										Jumlah
									</label>
									<input
										id="quantity"
										type="number"
										min="1"
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
										placeholder="Contoh: 100"
										className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
									/>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="destinationId"
										className="text-xs font-medium text-slate-500">
										Mitra Tujuan
									</label>
									{destinations.length === 0 && !isLoadingOptions ? (
										<p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
											Belum ada data mitra. Tambahkan dulu di halaman Mitra.
										</p>
									) : (
										<select
											id="destinationId"
											value={destinationId}
											onChange={(e) => setDestinationId(e.target.value)}
											disabled={isLoadingOptions}
											className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50">
											<option value="">Pilih klinik tujuan</option>
											{destinations.map((dest) => (
												<option key={dest.id} value={dest.id}>
													{dest.name}
												</option>
											))}
										</select>
									)}
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<label
											htmlFor="scheduledDate"
											className="text-xs font-medium text-slate-500">
											Tanggal
										</label>
										<input
											id="scheduledDate"
											type="date"
											value={scheduledDate}
											onChange={(e) => setScheduledDate(e.target.value)}
											className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
										/>
									</div>
									<div className="space-y-1.5">
										<label
											htmlFor="scheduledTime"
											className="text-xs font-medium text-slate-500">
											Jam
										</label>
										<input
											id="scheduledTime"
											type="time"
											value={scheduledTime}
											onChange={(e) => setScheduledTime(e.target.value)}
											className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="driverId"
										className="text-xs font-medium text-slate-500">
										Driver (opsional)
									</label>
									<select
										id="driverId"
										value={driverId}
										onChange={(e) => setDriverId(e.target.value)}
										disabled={isLoadingOptions}
										className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50">
										<option value="">Belum ditentukan</option>
										{drivers.map((driver) => (
											<option key={driver.id} value={driver.id}>
												{driver.nama}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-1.5">
									<label
										htmlFor="vehicleId"
										className="text-xs font-medium text-slate-500">
										Kendaraan (opsional)
									</label>
									<select
										id="vehicleId"
										value={vehicleId}
										onChange={(e) => setVehicleId(e.target.value)}
										disabled={isLoadingOptions}
										className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50">
										<option value="">Belum ditentukan</option>
										{vehicles.map((vehicle) => (
											<option key={vehicle.id} value={vehicle.id}>
												{vehicle.model} ({vehicle.plat})
											</option>
										))}
									</select>
								</div>

								<div className="flex justify-end gap-2 pt-4">
									<button
										type="button"
										onClick={onClose}
										className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
										Batal
									</button>
									<button
										type="submit"
										disabled={isSubmitting || isLoadingOptions}
										className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary cursor-pointer rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[140px]">
										{isSubmitting
											? "Menyimpan..."
											: editData
												? "Simpan Perubahan"
												: "Buat Pengiriman"}
									</button>
								</div>
							</form>
						</div>
					</div>
				);
}