"use client";

import { useEffect, useState } from "react";
import {
	XIcon,
	ShieldAlertIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	SendIcon,
	WalletIcon,
} from "lucide-react";

const ISSUE_LABEL: Record<string, string> = {
	PARKIR: "Parkir",
	TOILET: "Toilet",
	AKSES: "Akses Jalan",
	KEBERSIHAN: "Kebersihan",
	HARGA: "Harga",
	PELAYANAN: "Pelayanan",
	LAINNYA: "Lainnya",
};

interface FacilityCheck {
	keyword: string;
	category: string;
	claimedByBpodt: boolean;
	gapScore: number;
	negativeCount: number;
	totalMentions: number;
	mismatch: boolean;
}

interface AuditDetail {
	kabupaten: string;
	hoursCheck: { oursHours: string; bpodtHours: string; mismatch: boolean };
	facilityChecks: FacilityCheck[];
	unverifiableFacilities: string[];
	bpodtFacilitiesRaw: string;
}

interface PlaceWithAudit {
	id: string;
	name: string;
	bpodtVerified: string;
	bpodtNote: string | null;
	bpodtAuditDetail: AuditDetail | null;
}

export default function BpodtAuditModal({
	placeId,
	onClose,
}: {
	placeId: string;
	onClose: () => void;
}) {
	const [place, setPlace] = useState<PlaceWithAudit | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetch(`/api/places/${placeId}`)
			.then((res) => res.json())
			.then((data) => {
				setPlace(data);
				setIsLoading(false);
			});
	}, [placeId]);

	async function sendAlert() {
		setIsSubmitting(true);
		setActionMessage(null);
		const res = await fetch("/api/admin/audit-alerts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ placeId }),
		});
		setIsSubmitting(false);
		setActionMessage(
			res.ok
				? "Alert terkirim ke antrian laporan pemerintah."
				: "Gagal mengirim alert.",
		);
	}

	async function proposeBudget() {
		setIsSubmitting(true);
		setActionMessage(null);
		const res = await fetch("/api/budget-proposals/from-audit", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ placeId }),
		});
		setIsSubmitting(false);
		setActionMessage(
			res.ok
				? "Diajukan ke Prioritas Anggaran."
				: "Gagal mengajukan ke prioritas anggaran.",
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
					<div className="flex items-center gap-2">
						<ShieldAlertIcon className="w-4 h-4 text-red-600" />
						<h2 className="text-base font-semibold text-slate-900">
							Audit Kepatuhan BPODT
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
						<XIcon className="w-4 h-4" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
					{isLoading && <p className="text-sm text-slate-400">Memuat audit...</p>}

					{!isLoading && place && !place.bpodtAuditDetail && (
						<p className="text-sm text-slate-400">
							Belum ada detail audit untuk tempat ini.
						</p>
					)}

					{!isLoading && place && place.bpodtAuditDetail && (
						<>
							<div>
								<h3 className="font-semibold text-slate-900">{place.name}</h3>
								<p className="text-xs text-slate-400 mt-0.5">
									Kabupaten {place.bpodtAuditDetail.kabupaten}
								</p>
							</div>

							<div
								className={`rounded-lg p-3 border text-sm ${
									place.bpodtAuditDetail.hoursCheck.mismatch
										? "bg-red-50 border-red-100"
										: "bg-green-50 border-green-100"
								}`}>
								<div className="flex items-center gap-1.5 font-semibold mb-1">
									{place.bpodtAuditDetail.hoursCheck.mismatch ? (
										<AlertTriangleIcon className="w-3.5 h-3.5 text-red-600" />
									) : (
										<CheckCircle2Icon className="w-3.5 h-3.5 text-green-600" />
									)}
									Jam Operasional
								</div>
								<div className="text-xs text-slate-600">
									Data kami: {place.bpodtAuditDetail.hoursCheck.oursHours}
								</div>
								<div className="text-xs text-slate-600">
									BPODT: {place.bpodtAuditDetail.hoursCheck.bpodtHours}
								</div>
							</div>

							{place.bpodtAuditDetail.facilityChecks.length > 0 && (
								<div>
									<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
										Fasilitas Klaim BPODT vs Realita Keluhan
									</h4>
									<div className="space-y-2">
										{place.bpodtAuditDetail.facilityChecks.map((fc, idx) => (
											<div
												key={idx}
												className={`rounded-lg p-3 border text-sm ${
													fc.mismatch
														? "bg-red-50 border-red-100"
														: "bg-green-50 border-green-100"
												}`}>
												<div className="flex items-center justify-between">
													<span className="font-medium capitalize">{fc.keyword}</span>
													<span
														className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
															fc.mismatch
																? "bg-red-100 text-red-700"
																: "bg-green-100 text-green-700"
														}`}>
														{fc.mismatch ? "Tidak Sinkron" : "Sesuai"}
													</span>
												</div>
												<p className="text-xs text-slate-600 mt-1">
													BPODT klaim tersedia. Realita: {fc.negativeCount}/
													{fc.totalMentions} ulasan ({Math.round(fc.gapScore * 100)}%)
													mengeluhkan {ISSUE_LABEL[fc.category] ?? fc.category} secara
													negatif.
												</p>
											</div>
										))}
									</div>
								</div>
							)}

							{place.bpodtAuditDetail.unverifiableFacilities.length > 0 && (
								<p className="text-xs text-slate-400">
									Fasilitas lain yang diklaim BPODT namun belum bisa diverifikasi
									otomatis: {place.bpodtAuditDetail.unverifiableFacilities.join(", ")}
								</p>
							)}
						</>
					)}

					{actionMessage && (
						<div className="text-xs font-medium text-primary bg-primary/10 rounded-lg p-2.5">
							{actionMessage}
						</div>
					)}
				</div>

				<div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
					<button
						onClick={sendAlert}
						disabled={isSubmitting}
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
						<SendIcon className="w-3.5 h-3.5" />
						Kirim Alert ke Pengelola
					</button>
					<button
						onClick={proposeBudget}
						disabled={isSubmitting}
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-secondary rounded-lg transition-colors disabled:opacity-50">
						<WalletIcon className="w-3.5 h-3.5" />
						Ajukan ke Prioritas Anggaran
					</button>
				</div>
			</div>
		</div>
	);
}
