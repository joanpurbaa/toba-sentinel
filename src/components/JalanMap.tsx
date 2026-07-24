"use client";

import { useEffect, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Polyline,
	CircleMarker,
	Popup,
} from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

interface RoadRoute {
	id: string;
	placeId: string;
	placeName: string;
	placeCode: string;
	geometry: { type: string; coordinates: [number, number][] };
	distanceKm: number;
	gapScore: number | null;
	negativeCount: number;
	totalMentions: number;
}

const REFERENCE_POINT: [number, number] = [2.6717, 98.9339];

function gapColor(gapScore: number | null): string {
	if (gapScore === null) return "#9ca3af";
	const clamped = Math.max(0, Math.min(1, gapScore));
	const hue = (1 - clamped) * 120;
	return `hsl(${hue}, 80%, 45%)`;
}

export default function JalanMap() {
	const [routes, setRoutes] = useState<RoadRoute[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetch("/api/road-access")
			.then((res) => res.json())
			.then((data) => {
				setRoutes(data);
				setIsLoading(false);
			});
	}, []);

	return (
		<div className="flex flex-col w-full h-full p-4 sm:p-6 space-y-6">
			<div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-xs">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Kondisi Akses Jalan ke Destinasi
				</h1>
				<p className="text-sm text-muted-foreground font-medium mt-1">
					Rute jalan nyata (OpenStreetMap) dari Parapat ke tiap destinasi wisata.
					Warna menunjukkan proporsi keluhan akses/jalan dari pengunjung — merah
					berarti banyak dikeluhkan, hijau berarti jarang dikeluhkan. Ini indikator
					agregat per destinasi, bukan deteksi kerusakan per titik jalan.
				</p>
			</div>

			<div className="flex-1 min-h-[600px] bg-card border border-border rounded-2xl overflow-hidden shadow-xs relative z-0">
				{isLoading && (
					<div className="absolute inset-0 z-30 flex items-center justify-center bg-card/80 text-sm text-muted-foreground backdrop-blur-xs">
						Memuat rute...
					</div>
				)}

				{!isLoading && routes.length === 0 && (
					<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 text-sm text-muted-foreground p-6 text-center">
						Belum ada data rute. Jalankan scripts/generate-road-access.ts terlebih
						dahulu.
					</div>
				)}

				<MapContainer
					center={REFERENCE_POINT}
					zoom={10}
					scrollWheelZoom
					className="z-10"
					style={{ width: "100%", height: "100%" }}>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution="&copy; OpenStreetMap contributors"
					/>

					<CircleMarker
						center={REFERENCE_POINT}
						radius={9}
						pathOptions={{ color: "#1e293b", fillColor: "#1e293b", fillOpacity: 1 }}>
						<Popup>
							<div className="text-sm font-semibold">Parapat (Titik Referensi)</div>
						</Popup>
					</CircleMarker>

					{routes.map((r) => {
						const positions = r.geometry.coordinates.map(
							([lon, lat]) => [lat, lon] as [number, number],
						);
						const color = gapColor(r.gapScore);
						return (
							<Polyline
								key={r.id}
								positions={positions}
								pathOptions={{ color, weight: 4, opacity: 0.8 }}>
								<Popup>
									<div className="text-sm">
										<div className="font-semibold">{r.placeName}</div>
										<div className="text-xs text-muted-foreground mt-1">
											Jarak: {r.distanceKm.toFixed(1)} km dari Parapat
										</div>
										{r.totalMentions > 0 ? (
											<div className="text-xs mt-1">
												Keluhan akses: {r.negativeCount}/{r.totalMentions} ulasan (
												{Math.round((r.gapScore ?? 0) * 100)}%)
											</div>
										) : (
											<div className="text-xs text-muted-foreground mt-1">
												Belum ada data keluhan akses
											</div>
										)}
										<Link
											href={`/tempat/${r.placeId}`}
											className="inline-block text-xs font-semibold text-primary hover:underline mt-2">
											Lihat detail →
										</Link>
									</div>
								</Popup>
							</Polyline>
						);
					})}
				</MapContainer>
			</div>
		</div>
	);
}
