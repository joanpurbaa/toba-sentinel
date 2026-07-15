"use client";

import { useEffect, useState } from "react";
import { XIcon, SnowflakeIcon, ShieldAlertIcon } from "lucide-react";
import type { ItemDetail } from "@/app/types/StokBarang";

interface ItemDetailModalProps {
	itemId: string;
	onClose: () => void;
}

const storageLabel: Record<string, string> = {
	SUHU_RUANG: "Suhu Ruang",
	DINGIN: "Dingin (2-8°C)",
	BEKU: "Beku",
};

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export default function ItemDetailModal({
	itemId,
	onClose,
}: ItemDetailModalProps) {
	const [item, setItem] = useState<ItemDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);
		fetch(`/api/items/${itemId}`)
			.then((response) => response.json())
			.then((data) => {
				if (isMounted) setItem(data.item ?? null);
			})
			.finally(() => {
				if (isMounted) setIsLoading(false);
			});
		return () => {
			isMounted = false;
		};
	}, [itemId]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			/>

			<div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
					<div>
						<h2 className="text-base font-semibold text-slate-900">Detail Item</h2>
						<p className="text-xs text-slate-400 font-medium mt-0.5">
							Informasi lengkap dan riwayat batch item ini.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
						<XIcon className="w-4 h-4" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
					{isLoading && (
						<div className="text-center text-sm text-slate-400 py-8">
							Memuat detail item...
						</div>
					)}

					{!isLoading && !item && (
						<div className="text-center text-sm text-slate-400 py-8">
							Item tidak ditemukan.
						</div>
					)}

					{!isLoading && item && (
						<>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
									{(item.storageCondition === "DINGIN" ||
										item.storageCondition === "BEKU") && (
										<span className="inline-flex items-center justify-center w-5 h-5 rounded bg-sky-50 border border-sky-100">
											<SnowflakeIcon className="w-3 h-3 text-sky-600" />
										</span>
									)}
									{item.isControlledSubstance && (
										<ShieldAlertIcon className="w-4 h-4 text-purple-500" />
									)}
								</div>
								<p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Kode SKU
									</span>
									<span className="font-mono text-slate-800">{item.sku}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Kategori
									</span>
									<span className="text-slate-800">{item.category}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Gudang
									</span>
									<span className="text-slate-800">{item.warehouseName}</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Stok Saat Ini
									</span>
									<span className="text-slate-800 font-bold">
										{item.currentStock} {item.unit}
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Batas Menipis
									</span>
									<span className="text-slate-800">
										{item.minThreshold} {item.unit}
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Batas Kritis
									</span>
									<span className="text-slate-800">
										{item.criticalThreshold} {item.unit}
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Kondisi Simpan
									</span>
									<span className="text-slate-800">
										{storageLabel[item.storageCondition]}
									</span>
								</div>
								<div>
									<span className="text-xs font-semibold text-slate-500 block">
										Nomor BPOM
									</span>
									<span className="text-slate-800">
										{item.registrationNumber ?? "-"}
									</span>
								</div>
							</div>

							<div>
								<h4 className="text-sm font-semibold text-slate-900 mb-2">
									Riwayat Batch ({item.batches.length})
								</h4>
								<div className="border border-slate-200 rounded-lg overflow-hidden">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
												<th className="px-4 py-2.5">Batch</th>
												<th className="px-4 py-2.5">Kadaluarsa</th>
												<th className="px-4 py-2.5">Sisa</th>
												<th className="px-4 py-2.5">Vendor</th>
												<th className="px-4 py-2.5">Diterima</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 text-sm text-slate-700">
											{item.batches.length === 0 && (
												<tr>
													<td colSpan={5} className="px-4 py-4 text-center text-slate-400">
														Belum ada batch untuk item ini.
													</td>
												</tr>
											)}
											{item.batches.map((batch) => (
												<tr key={batch.id}>
													<td className="px-4 py-2.5 font-mono text-xs">
														{batch.batchNumber}
													</td>
													<td className="px-4 py-2.5">{formatDate(batch.expiryDate)}</td>
													<td className="px-4 py-2.5">
														{batch.quantityRemaining}/{batch.quantityReceived}
													</td>
													<td className="px-4 py-2.5">{batch.vendorName ?? "-"}</td>
													<td className="px-4 py-2.5">{formatDate(batch.receivedAt)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
