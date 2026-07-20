"use client";

import React, { useEffect, useState } from "react";
import {
	X,
	CheckCircle2,
	AlertTriangle,
	HelpCircle,
	MapPin,
	Clock,
	Building,
	Star,
	FileText,
	AlertCircle,
	MessageSquare,
	Send,
} from "lucide-react";
import type { BpodtAuditDetail } from "@/app/types/BpodtAudit";
import { useBpodtAuditStore } from "@/store/useBpodtAuditStore";

interface BpodtAuditDetailModalProps {
	placeId: string | null;
	isOpen: boolean;
	onClose: () => void;
}

export default function BpodtAuditDetailModal({
	placeId,
	isOpen,
	onClose,
}: BpodtAuditDetailModalProps) {
	const updateAuditStatus = useBpodtAuditStore(
		(state) => state.updateAuditStatus,
	);

	const [detail, setDetail] = useState<BpodtAuditDetail | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [status, setStatus] = useState<string>("BELUM_DICEK");
	const [note, setNote] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen || !placeId) return;

		const fetchDetail = async () => {
			setLoading(true);
			setErrorMessage(null);
			try {
				const res = await fetch(`/api/admin/bpodt-audit/${placeId}`);
				const data = await res.json();
				if (res.ok) {
					setDetail(data);
					setStatus(data.bpodtVerified ?? "BELUM_DICEK");
					setNote(data.bpodtNote ?? "");
				} else {
					setErrorMessage(data.error ?? "Gagal memuat detail data");
				}
			} catch {
				setErrorMessage("Terjadi kesalahan koneksi");
			} finally {
				setLoading(false);
			}
		};

		fetchDetail();
	}, [isOpen, placeId]);

	if (!isOpen || !placeId) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrorMessage(null);

		const success = await updateAuditStatus(placeId, status, note);
		setIsSubmitting(false);

		if (success) {
			onClose();
		} else {
			setErrorMessage("Gagal menyimpan hasil verifikasi BPODT");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
			<div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				<div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
					<div>
						<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
							Audit Compliance BPODT
						</span>
						<h2 className="text-lg font-bold text-slate-900 mt-0.5">
							{detail ? detail.name : "Memuat Data..."}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-600">
					{loading && (
						<div className="py-12 text-center text-slate-400 font-medium">
							Sedang mengambil detail tempat dan laporan audit...
						</div>
					)}

					{errorMessage && !loading && (
						<div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					)}

					{!loading && detail && (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
									<div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
										<Building className="w-4 h-4 text-slate-500" />
										Informasi Utama
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Kode Tempat</div>
										<div className="font-mono text-xs text-slate-800">
											{detail.placeCode}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Kategori</div>
										<div className="font-medium text-slate-800">{detail.category}</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Pemilik / Pengelola</div>
										<div className="font-medium text-slate-800">
											{detail.ownerName ?? "-"}
										</div>
									</div>
								</div>

								<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
									<div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
										<MapPin className="w-4 h-4 text-slate-500" />
										Lokasi & Operasional
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Alamat</div>
										<div className="text-xs text-slate-800 line-clamp-2">
											{detail.address ?? "-"}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Jam Operasional</div>
										<div className="flex items-center gap-1.5 text-xs text-slate-800">
											<Clock className="w-3.5 h-3.5 text-slate-400" />
											{detail.operationalHour ?? "-"}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-xs text-slate-400">Rating Publik</div>
										<div className="flex items-center gap-1 text-slate-800 font-semibold text-xs">
											<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
											{detail.rating ? detail.rating.toFixed(1) : "-"}
										</div>
									</div>
								</div>
							</div>

							{detail.issueSummaries.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
										<AlertTriangle className="w-4 h-4 text-amber-500" />
										Ringkasan Masalah AI & Publik
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{detail.issueSummaries.map((is) => (
											<div
												key={is.category}
												className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
												<div>
													<div className="font-semibold text-xs text-slate-900">
														{is.category}
													</div>
													<div className="text-[11px] text-slate-400 mt-0.5">
														{is.negativeCount} negatif dari {is.totalMentions} ulasan
													</div>
												</div>
												<span
													className={`text-xs font-bold px-2 py-0.5 rounded-full ${
														is.gapScore >= 0.6
															? "bg-red-50 text-red-700 border border-red-100"
															: is.gapScore >= 0.3
																? "bg-amber-50 text-amber-700 border border-amber-100"
																: "bg-green-50 text-green-700 border border-green-100"
													}`}>
													{Math.round(is.gapScore * 100)}% Gap
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{detail.recentReviews.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
										<MessageSquare className="w-4 h-4 text-slate-400" />
										Sampel Ulasan Terbaru
									</h3>
									<div className="space-y-2">
										{detail.recentReviews.map((rev) => (
											<div
												key={rev.id}
												className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
												<div className="flex items-center justify-between text-slate-500">
													<span className="font-medium text-slate-700">
														{rev.reviewerName ?? "Anonim"}
													</span>
													<span>{rev.reviewerRating ? `★ ${rev.reviewerRating}` : ""}</span>
												</div>
												<p className="text-slate-600 italic">
													&quot;{rev.reviewText ?? "Tidak ada deskripsi"}&quot;
												</p>
											</div>
										))}
									</div>
								</div>
							)}

							<form
								onSubmit={handleSubmit}
								className="pt-4 border-t border-slate-100 space-y-4">
								<div className="space-y-2">
									<label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
										Update Status Compliance BPODT
									</label>
									<div className="grid grid-cols-3 gap-3">
										<button
											type="button"
											onClick={() => setStatus("SINKRON")}
											className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
												status === "SINKRON"
													? "bg-green-50 border-green-500 text-green-700 shadow-xs"
													: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
											}`}>
											<CheckCircle2 className="w-4 h-4 text-green-600" />
											Sinkron
										</button>
										<button
											type="button"
											onClick={() => setStatus("TIDAK_SINKRON")}
											className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
												status === "TIDAK_SINKRON"
													? "bg-red-50 border-red-500 text-red-700 shadow-xs"
													: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
											}`}>
											<AlertTriangle className="w-4 h-4 text-red-600" />
											Tidak Sinkron
										</button>
										<button
											type="button"
											onClick={() => setStatus("BELUM_DICEK")}
											className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
												status === "BELUM_DICEK"
													? "bg-slate-100 border-slate-400 text-slate-800 shadow-xs"
													: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
											}`}>
											<HelpCircle className="w-4 h-4 text-slate-500" />
											Belum Dicek
										</button>
									</div>
								</div>

								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
										<FileText className="w-3.5 h-3.5 text-slate-400" />
										Catatan Auditor BPODT
									</label>
									<textarea
										rows={3}
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder="Masukkan catatan ketidaksesuaian data atau rekomendasi audit..."
										className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none"
									/>
								</div>

								<div className="flex justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={onClose}
										disabled={isSubmitting}
										className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
										Batal
									</button>
									<button
										type="submit"
										disabled={isSubmitting}
										className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50">
										<Send className="w-3.5 h-3.5" />
										{isSubmitting ? "Menyimpan..." : "Simpan Audit"}
									</button>
								</div>
							</form>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
