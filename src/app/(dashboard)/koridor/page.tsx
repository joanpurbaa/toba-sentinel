"use client";

import { useState, useEffect } from "react";
import {
	Bus,
	MapPin,
	Store,
	AlertTriangle,
	CheckCircle2,
	ArrowRight,
	Plus,
	Search,
	Filter,
} from "lucide-react";

interface Corridor {
	id: string;
	name: string;
	kabupaten: string;
	description: string;
	status: "OPTIMAL" | "NEED_TRANSPORT" | "ISOLATED_UMKM";
	transitHubName: string;
	distanceToHubKm: number;
	hasPublicTransit: boolean;
	transportTypes: string[];
	connectedUmkmCount: number;
	recommendedAction: string;
	estimatedBudget: number;
	place: {
		name: string;
		placeCode: string;
	};
}

export default function CorridorPlannerPage() {
	const [corridors, setCorridors] = useState<Corridor[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedKabupaten, setSelectedKabupaten] = useState("ALL");
	const [searchQuery, setSearchQuery] = useState("");

	// Mock initial load / Fetch API
	useEffect(() => {
		// Ganti dengan fetch(`/api/admin/corridors?kabupaten=${selectedKabupaten}`) jika DB sudah diisi
		setTimeout(() => {
			setCorridors([
				{
					id: "cor-1",
					name: "Koridor Pariwisata Tomok - Tuktuk",
					kabupaten: "Samosir",
					description:
						"Konektivitas pelabuhan Tomok menuju kawasan resor Tuktuk & UMKM Souvenir.",
					status: "NEED_TRANSPORT",
					transitHubName: "Pelabuhan Tomok",
					distanceToHubKm: 4.2,
					hasPublicTransit: false,
					transportTypes: ["Bentor / Becak Motor"],
					connectedUmkmCount: 28,
					recommendedAction: "Pengadaan 2 Unit Electric Microbus Shuttle Pemkab",
					estimatedBudget: 450000000,
					place: { name: "Patung Sigalegale", placeCode: "SMS-001" },
				},
				{
					id: "cor-2",
					name: "Koridor Jalur Danau Sipolha - Haranggaol",
					kabupaten: "Simalungun",
					description:
						"Rute akses terpencil penghubung destinasi perkemahan ke pasar UMKM lokal.",
					status: "ISOLATED_UMKM",
					transitHubName: "Dermaga Haranggaol",
					distanceToHubKm: 8.5,
					hasPublicTransit: true,
					transportTypes: ["Kapal Kayu Tradisional"],
					connectedUmkmCount: 5,
					recommendedAction: "Pembangunan Hub UMKM & Trayek Angkot Terpadu",
					estimatedBudget: 250000000,
					place: { name: "Bukit Sipolha", placeCode: "SML-004" },
				},
				{
					id: "cor-3",
					name: "Koridor Utama Balige Hub",
					kabupaten: "Toba",
					description:
						"Jalur utama terintegrasi dari Bandara Silangit ke Museum Batak TB Silalahi.",
					status: "OPTIMAL",
					transitHubName: "Bandara Silangit / Terminal Balige",
					distanceToHubKm: 2.1,
					hasPublicTransit: true,
					transportTypes: ["DAMRI", "Angkot", "Taxi Online"],
					connectedUmkmCount: 64,
					recommendedAction: "Pemeliharaan Rute & Integrasi Ticketing Digital",
					estimatedBudget: 50000000,
					place: { name: "Museum TB Silalahi", placeCode: "TOB-002" },
				},
			]);
			setLoading(false);
		}, 400);
	}, [selectedKabupaten]);

	const filtered = corridors.filter(
		(c) =>
			c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.place.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="p-6 space-y-6 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900 tracking-tight">
						Interconnected Tourism Corridor Planner
					</h1>
					<p className="text-xs text-slate-500 mt-1">
						Analisis konektivitas destinasi wisata, moda transportasi publik, dan
						jangkauan ekosistem UMKM.
					</p>
				</div>
				<button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm">
					<Plus className="w-4 h-4" />
					Tambah Koridor Baru
				</button>
			</div>

			{/* Metric Cards Summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
					<div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
						<AlertTriangle className="w-5 h-5" />
					</div>
					<div>
						<div className="text-2xl font-bold text-slate-900">12 Koridor</div>
						<div className="text-xs text-slate-500 font-medium">
							Butuh Intervensi Transportasi
						</div>
					</div>
				</div>
				<div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
					<div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
						<Store className="w-5 h-5" />
					</div>
					<div>
						<div className="text-2xl font-bold text-slate-900">184 UMKM</div>
						<div className="text-xs text-slate-500 font-medium">
							Terhubung Jalur Utama
						</div>
					</div>
				</div>
				<div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
					<div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
						<CheckCircle2 className="w-5 h-5" />
					</div>
					<div>
						<div className="text-2xl font-bold text-slate-900">85%</div>
						<div className="text-xs text-slate-500 font-medium">
							Indeks Aksesibilitas Kawasan
						</div>
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Cari nama koridor atau destinasi..."
						className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
					/>
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<Filter className="w-4 h-4 text-slate-400" />
					<select
						value={selectedKabupaten}
						onChange={(e) => setSelectedKabupaten(e.target.value)}
						className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-700 bg-white">
						<option value="ALL">Semua Kabupaten</option>
						<option value="Samosir">Samosir</option>
						<option value="Simalungun">Simalungun</option>
						<option value="Toba">Toba</option>
						<option value="Dairi">Dairi</option>
					</select>
				</div>
			</div>

			{/* Corridor Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{filtered.map((item) => (
					<div
						key={item.id}
						className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow">
						<div className="flex items-start justify-between gap-3">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
									{item.kabupaten} • {item.place.placeCode}
								</span>
								<h3 className="text-base font-bold text-slate-900 mt-1">{item.name}</h3>
							</div>
							<StatusBadge status={item.status} />
						</div>

						<p className="text-xs text-slate-600 leading-relaxed">
							{item.description}
						</p>

						{/* Visual Corridor Connection Graph */}
						<div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
							<div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
								<span className="flex items-center gap-1.5">
									<MapPin className="w-3.5 h-3.5 text-red-500" />
									{item.transitHubName}
								</span>
								<div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
									<span>{item.distanceToHubKm} km</span>
									<ArrowRight className="w-3.5 h-3.5" />
								</div>
								<span className="flex items-center gap-1.5">
									<Bus className="w-3.5 h-3.5 text-blue-500" />
									{item.place.name}
								</span>
							</div>
							<div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
								<span>
									Moda Eksisting: <strong>{item.transportTypes.join(", ")}</strong>
								</span>
								<span className="font-semibold text-slate-700">
									{item.connectedUmkmCount} UMKM Terhubung
								</span>
							</div>
						</div>

						{/* Recommendation Box */}
						<div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs space-y-1">
							<span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
								⚡ Rekomendasi Intervensi Rute
							</span>
							<p className="text-amber-800 font-medium">{item.recommendedAction}</p>
							<div className="text-[11px] font-bold text-amber-900 pt-1">
								Estimasi Anggaran: Rp {item.estimatedBudget.toLocaleString("id-ID")}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: Corridor["status"] }) {
	if (status === "NEED_TRANSPORT") {
		return (
			<span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
				🚨 Butuh Transportasi
			</span>
		);
	}
	if (status === "ISOLATED_UMKM") {
		return (
			<span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
				⚠️ UMKM Terisolasi
			</span>
		);
	}
	return (
		<span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
			✓ Terkoneksi Baik
		</span>
	);
}
