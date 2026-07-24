"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import BpodtAuditModal from "@/components/modal/BpodtAuditModal";
import "leaflet/dist/leaflet.css";

type PlacePoint = {
	id: string;
	placeCode: string;
	name: string;
	category: string;
	subtype: string | null;
	latitude: number;
	longitude: number;
	rating: number | null;
	address: string | null;
	aiGapScore: number | null;
	aiTotalMentions: number;
	aiWorstCategory: string | null;
	bpodtVerified: string;
};

const CATEGORY_LABEL: Record<string, string> = {
	WISATA: "Wisata",
	HOTEL: "Hotel",
	RESTO: "Kuliner",
};

const ISSUE_LABEL: Record<string, string> = {
	PARKIR: "Parkir",
	TOILET: "Toilet",
	AKSES: "Akses Jalan",
	KEBERSIHAN: "Kebersihan",
	HARGA: "Harga",
	PELAYANAN: "Pelayanan",
	LAINNYA: "Lainnya",
};

type ColorMode = "rating" | "ai";

function ratingColor(rating: number | null): string {
	if (rating === null) return "#9ca3af";
	const clamped = Math.max(1, Math.min(5, rating));
	const hue = ((clamped - 1) / 4) * 120;
	return `hsl(${hue}, 75%, 45%)`;
}

function gapColor(gapScore: number | null): string {
	if (gapScore === null) return "#9ca3af";
	const clamped = Math.max(0, Math.min(1, gapScore));
	const hue = (1 - clamped) * 120;
	return `hsl(${hue}, 80%, 45%)`;
}

export default function DashboardMap() {
	const [places, setPlaces] = useState<PlacePoint[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [colorMode, setColorMode] = useState<ColorMode>("rating");
	const [negativeOnly, setNegativeOnly] = useState(false);
	const [auditTarget, setAuditTarget] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/places/map")
			.then((res) => res.json())
			.then((data) => {
				setPlaces(data);
				setIsLoading(false);
			});
	}, []);

	const visiblePlaces = useMemo(() => {
		if (!negativeOnly) return places;
		return places.filter((p) => p.aiGapScore !== null && p.aiGapScore >= 0.5);
	}, [places, negativeOnly]);

	const negativeCount = useMemo(
		() =>
			places.filter((p) => p.aiGapScore !== null && p.aiGapScore >= 0.5).length,
		[places],
	);

	return (
		<div className="relative w-full h-full">
			{isLoading && (
				<div className="absolute inset-0 z-30 flex items-center justify-center bg-card/80 text-sm text-muted-foreground backdrop-blur-xs">
					Memuat peta...
				</div>
			)}

			<div className="absolute top-3 right-3 z-20 bg-card border border-border rounded-xl shadow-md p-3 space-y-2.5 w-[240px]">
				<div>
					<div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
						Mode Warna
					</div>
					<div className="grid grid-cols-2 gap-1.5">
						<button
							onClick={() => setColorMode("rating")}
							className={`text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors ${
								colorMode === "rating"
									? "bg-primary text-secondary-foreground border-primary"
									: "bg-background text-muted-foreground border-border hover:bg-muted/40"
							}`}>
							Rating
						</button>
						<button
							onClick={() => setColorMode("ai")}
							className={`text-xs font-medium px-2 py-1.5 rounded-lg border transition-colors ${
								colorMode === "ai"
									? "bg-primary text-secondary-foreground border-primary"
									: "bg-background text-muted-foreground border-border hover:bg-muted/40"
							}`}>
							Analisis AI
						</button>
					</div>
				</div>

				<label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1 border-t border-border">
					<input
						type="checkbox"
						checked={negativeOnly}
						onChange={(e) => setNegativeOnly(e.target.checked)}
						className="accent-primary"
					/>
					Hanya tempat bermasalah
					<span className="ml-auto text-[10px] text-muted-foreground">
						({negativeCount})
					</span>
				</label>

				{colorMode === "ai" && (
					<p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t border-border">
						Warna berdasarkan proporsi keluhan negatif di ulasan (hasil analisis AI).
						Abu-abu = belum ada data.
					</p>
				)}
			</div>

			<MapContainer
				center={[2.61, 99.0]}
				zoom={10}
				scrollWheelZoom
				className="z-10"
				style={{ width: "100%", height: "100%" }}>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution="&copy; OpenStreetMap contributors"
				/>
				{visiblePlaces.map((p) => {
					const color =
						colorMode === "rating" ? ratingColor(p.rating) : gapColor(p.aiGapScore);
					return (
						<CircleMarker
							key={p.id}
							center={[p.latitude, p.longitude]}
							radius={7}
							pathOptions={{
								color,
								fillColor: color,
								fillOpacity: 0.85,
								weight: 1,
							}}>
							<Popup>
								<div className="text-sm">
									<div className="font-semibold">{p.name}</div>
									<div className="text-xs text-muted-foreground">
										{CATEGORY_LABEL[p.category] ?? p.category}
										{p.subtype ? ` · ${p.subtype}` : ""}
									</div>
									<div className="text-xs mt-1">
										Rating: {p.rating !== null ? p.rating.toFixed(1) : "Belum ada"}
									</div>
									{p.aiTotalMentions > 0 && (
										<div className="text-xs mt-1">
											Keluhan AI: {Math.round((p.aiGapScore ?? 0) * 100)}% negatif
											{p.aiWorstCategory &&
												` (terbanyak: ${ISSUE_LABEL[p.aiWorstCategory] ?? p.aiWorstCategory})`}
										</div>
									)}
									{p.address && (
										<div className="text-xs text-muted-foreground mt-1">{p.address}</div>
									)}
									{p.bpodtVerified === "TIDAK_SINKRON" && (
										<button
											onClick={() => setAuditTarget(p.id)}
											className="inline-flex mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
											⚠ Tidak Sinkron BPODT — Lihat Audit
										</button>
									)}
									<Link
										href={`/tempat/${p.id}`}
										className="inline-block text-xs font-semibold text-primary hover:underline mt-2">
										Lihat detail →
									</Link>
								</div>
							</Popup>
						</CircleMarker>
					);
				})}
			</MapContainer>

			{auditTarget && (
				<BpodtAuditModal
					placeId={auditTarget}
					onClose={() => setAuditTarget(null)}
				/>
			)}
		</div>
	);
}
