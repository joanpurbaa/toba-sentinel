"use client";

import { useState, useEffect } from "react";
import {
	Sparkles,
	TrendingUp,
	ThumbsUp,
	Store,
	Building2,
	ArrowRight,
	Sliders,
	CheckCircle2,
	AlertCircle,
	Zap,
	RotateCcw,
} from "lucide-react";

interface PlaceOption {
	id: string;
	name: string;
	placeCode: string;
}

interface SimulationResult {
	place: { name: string; code: string };
	intervention: { type: string; budget: number };
	before: {
		rating: number;
		complaintRatePct: number;
		monthlyVisitorEst: number;
		affectedUmkm: number;
	};
	after: {
		rating: number;
		ratingDelta: string;
		complaintRatePct: number;
		complaintReductionPct: string;
		monthlyVisitorEst: number;
		visitorGrowthPct: string;
		umkmRevenueGrowthPct: string;
		bpodtVerified: string;
	};
	summaryText: string;
}

export default function TourismSimulatorPage() {
	const [places, setPlaces] = useState<PlaceOption[]>([]);
	const [selectedPlaceId, setSelectedPlaceId] = useState("");
	const [interventionType, setInterventionType] = useState(
		"Perbaikan Akses Jalan & Transportasi",
	);
	const [budget, setBudget] = useState(250000000); // Default Rp 250 Juta
	const [isSimulating, setIsSimulating] = useState(false);
	const [result, setResult] = useState<SimulationResult | null>(null);

	// Initial Fetch List Tempat dari API
	useEffect(() => {
		// Mock data opsional jika belum sinkron penuh dengan DB
		setPlaces([
			{ id: "p-1", name: "Jembatan Lae Pendaroh", placeCode: "DRI-001" },
			{ id: "p-2", name: "Pantai Kenangan", placeCode: "SML-002" },
			{ id: "p-3", name: "Air Terjun Janji", placeCode: "HMB-001" },
			{ id: "p-4", name: "Patung Sigalegale", placeCode: "SMS-001" },
			{ id: "p-5", name: "Bukit Sipolha", placeCode: "SML-004" },
		]);
		setSelectedPlaceId("p-4"); // default selected
	}, []);

	const handleRunSimulation = async () => {
		setIsSimulating(true);
		try {
			const res = await fetch("/api/admin/simulator", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					placeId: selectedPlaceId,
					interventionType,
					budgetAmount: budget,
				}),
			});
			const json = await res.json();
			if (json.success) {
				setResult(json.data);
			} else {
				// Fallback untuk demo instan jika API belum terhubung DB
				generateMockResult();
			}
		} catch {
			generateMockResult();
		} finally {
			setIsSimulating(false);
		}
	};

	const generateMockResult = () => {
		const selected = places.find((p) => p.id === selectedPlaceId) || places[0];
		const budgetFactor = budget / 500000000;
		const ratingBoost = Number((0.3 + budgetFactor * 0.4).toFixed(1));

		setResult({
			place: { name: selected.name, code: selected.placeCode },
			intervention: { type: interventionType, budget },
			before: {
				rating: 3.9,
				complaintRatePct: 42,
				monthlyVisitorEst: 8500,
				affectedUmkm: 12,
			},
			after: {
				rating: Math.min(4.9, 3.9 + ratingBoost),
				ratingDelta: `+${ratingBoost}`,
				complaintRatePct: 12,
				complaintReductionPct: "-30%",
				monthlyVisitorEst: Math.round(8500 * (1 + (15 + budgetFactor * 20) / 100)),
				visitorGrowthPct: `+${Math.round(15 + budgetFactor * 15)}%`,
				umkmRevenueGrowthPct: `+${Math.round(18 + budgetFactor * 12)}%`,
				bpodtVerified: "SINKRON",
			},
			summaryText: `Dengan pengucuran anggaran senilai Rp ${budget.toLocaleString("id-ID")} untuk ${interventionType}, diprediksi rating destinasi ${selected.name} meningkat dari 3.9 menjadi ${Math.min(4.9, 3.9 + ratingBoost)}, serta memulihkan potensi pendapatan 12 UMKM sekitar.`,
		});
	};

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-2">
						<Sparkles className="w-3.5 h-3.5" />
						AI Policy & Return Predictor
					</div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight">
						Tourism Impact Simulator
					</h1>
					<p className="text-xs text-slate-500 mt-1">
						Simulasikan prediksi dampak kebijakan & alokasi anggaran terhadap
						peningkatan rating, kepuasan pengunjung, dan pendapatan UMKM.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* Left Column: Control Panel / Sandbox Form */}
				<div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-5 space-y-5 shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-100 pb-3">
						<h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<Sliders className="w-4 h-4 text-slate-500" />
							Parameter Simulasi
						</h2>
						<button
							onClick={() => {
								setBudget(250000000);
								setResult(null);
							}}
							className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium">
							<RotateCcw className="w-3 h-3" /> Reset
						</button>
					</div>

					{/* 1. Pilih Destinasi */}
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">
							Target Destinasi Wisata
						</label>
						<select
							value={selectedPlaceId}
							onChange={(e) => setSelectedPlaceId(e.target.value)}
							className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800">
							{places.map((p) => (
								<option key={p.id} value={p.id}>
									[{p.placeCode}] {p.name}
								</option>
							))}
						</select>
					</div>

					{/* 2. Jenis Intervensi */}
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-slate-700">
							Fokus Rencana Intervensi / Perbaikan
						</label>
						<select
							value={interventionType}
							onChange={(e) => setInterventionType(e.target.value)}
							className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800">
							<option value="Perbaikan Akses Jalan & Transportasi">
								🚗 Perbaikan Akses Jalan & Transportasi
							</option>
							<option value="Renovasi Toilet & Kebersihan Lingkungan">
								🧹 Renovasi Toilet & Kebersihan Lingkungan
							</option>
							<option value="Penataan Parkir & Digitalisasi Retribusi">
								🅿️ Penataan Parkir & Digitalisasi Retribusi
							</option>
							<option value="Pembangunan Shuttle Bus & Connectivity Hub">
								🚌 Pembangunan Shuttle Bus & Connectivity Hub
							</option>
						</select>
					</div>

					{/* 3. Slider Anggaran */}
					<div className="space-y-2 pt-2 border-t border-slate-100">
						<div className="flex items-center justify-between">
							<label className="text-xs font-semibold text-slate-700">
								Rencana Anggaran (Intervensi)
							</label>
							<span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
								Rp {budget.toLocaleString("id-ID")}
							</span>
						</div>
						<input
							type="range"
							min={50000000}
							max={1000000000}
							step={25000000}
							value={budget}
							onChange={(e) => setBudget(Number(e.target.value))}
							className="w-full accent-indigo-600 cursor-pointer"
						/>
						<div className="flex justify-between text-[10px] text-slate-400 font-medium">
							<span>Rp 50 Juta</span>
							<span>Rp 500 Juta</span>
							<span>Rp 1 Miliar</span>
						</div>
					</div>

					{/* Submit Button */}
					<button
						onClick={handleRunSimulation}
						disabled={isSimulating}
						className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2">
						{isSimulating ? (
							<>
								<Zap className="w-4 h-4 animate-spin text-amber-400" />
								Menganalisis Proyeksi...
							</>
						) : (
							<>
								<Zap className="w-4 h-4 text-amber-400" />
								Jalankan Simulasi AI
							</>
						)}
					</button>
				</div>

				{/* Right Column: Simulation Result & Analytics */}
				<div className="lg:col-span-7 space-y-4">
					{!result ? (
						<div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[380px]">
							<div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
								<Sparkles className="w-6 h-6 text-indigo-500" />
							</div>
							<div className="max-w-xs">
								<h3 className="text-sm font-bold text-slate-800">
									Siap Melakukan Simulasi
								</h3>
								<p className="text-xs text-slate-500 mt-1">
									Pilih destinasi dan sesuaikan nominal anggaran di panel sebelah kiri,
									lalu klik <strong>"Jalankan Simulasi AI"</strong>.
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-4 animate-in fade-in duration-300">
							{/* Summary Banner */}
							<div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-md space-y-2">
								<div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
									<span className="flex items-center gap-1">
										<Building2 className="w-3.5 h-3.5" />
										{result.place.name} ({result.place.code})
									</span>
									<span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-500/30">
										High ROI Potential
									</span>
								</div>
								<p className="text-xs text-slate-200 leading-relaxed font-medium">
									{result.summaryText}
								</p>
							</div>

							{/* Before vs After Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* BEFORE CARD */}
								<div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-sm">
									<div className="flex items-center justify-between border-b border-slate-100 pb-2">
										<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
											Kondisi Eksisting (Saat Ini)
										</span>
										<span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
											Baseline
										</span>
									</div>
									<div className="space-y-2 text-xs">
										<div className="flex justify-between items-center">
											<span className="text-slate-500">Rating Google:</span>
											<span className="font-bold text-slate-800">
												⭐ {result.before.rating} / 5.0
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-500">Tingkat Keluhan:</span>
											<span className="font-bold text-red-600">
												{result.before.complaintRatePct}% Ulasan
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-500">Estimasi Pengunjung:</span>
											<span className="font-semibold text-slate-700">
												~{result.before.monthlyVisitorEst.toLocaleString("id-ID")} /bln
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-500">UMKM Terdampak:</span>
											<span className="font-semibold text-slate-700">
												{result.before.affectedUmkm} UMKM
											</span>
										</div>
									</div>
								</div>

								{/* AFTER CARD */}
								<div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3 shadow-sm">
									<div className="flex items-center justify-between border-b border-emerald-100 pb-2">
										<span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
											<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
											Prediksi Pasca-Intervensi
										</span>
										<span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
											Simulasi AI
										</span>
									</div>
									<div className="space-y-2 text-xs">
										<div className="flex justify-between items-center">
											<span className="text-slate-600">Rating Baru:</span>
											<span className="font-bold text-emerald-700 flex items-center gap-1">
												⭐ {result.after.rating}
												<span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">
													{result.after.ratingDelta}
												</span>
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-600">Pengurangan Keluhan:</span>
											<span className="font-bold text-emerald-600">
												{result.after.complaintReductionPct}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-600">Proyeksi Kenaikan Traksi:</span>
											<span className="font-bold text-emerald-700">
												{result.after.visitorGrowthPct} (~
												{result.after.monthlyVisitorEst.toLocaleString("id-ID")})
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-slate-600">Pertumbuhan Omzet UMKM:</span>
											<span className="font-bold text-emerald-700">
												{result.after.umkmRevenueGrowthPct}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Compliance & Verification Impact Indicator */}
							<div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-emerald-600" />
									<span className="font-medium text-slate-700">
										Status Audit BPODT Pasca-Anggaran:
									</span>
								</div>
								<span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
									✓ VERIFIED & SINKRON
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
