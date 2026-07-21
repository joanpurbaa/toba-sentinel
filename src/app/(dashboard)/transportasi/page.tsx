"use client";

import { useEffect, useState } from "react";
import { SearchIcon, ShipIcon, BusIcon, ClockIcon } from "lucide-react";

interface Route {
	id: string;
	transportName: string;
	vehicleType: string | null;
	routeType: "DARAT" | "FERRY";
	routeCities: string[];
	routeDescription: string;
	priceMin: number | null;
	priceMax: number | null;
	priceRaw: string | null;
	operationalHour: string | null;
	description: string | null;
}

function formatPrice(
	min: number | null,
	max: number | null,
	raw: string | null,
) {
	if (min === null) return raw ?? "-";
	if (min === max) return `Rp ${min.toLocaleString("id-ID")}`;
	return `Rp ${min.toLocaleString("id-ID")} - Rp ${max?.toLocaleString("id-ID")}`;
}

export default function TransportasiPage() {
	const [routes, setRoutes] = useState<Route[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [routeType, setRouteType] = useState("ALL");

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsLoading(true);
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (routeType !== "ALL") params.set("routeType", routeType);
			fetch(`/api/transport?${params.toString()}`)
				.then((res) => res.json())
				.then((data) => {
					setRoutes(data);
					setIsLoading(false);
				});
		}, 300);
		return () => clearTimeout(timeout);
	}, [search, routeType]);

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Transportasi & Aksesibilitas
				</h1>
				<p className="text-sm text-muted-foreground font-medium">
					Data rute angkutan darat dan penyeberangan ferry di kawasan Danau Toba.
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Cari nama armada atau kota tujuan..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
				<select
					value={routeType}
					onChange={(e) => setRouteType(e.target.value)}
					className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground">
					<option value="ALL">Semua Moda</option>
					<option value="DARAT">Darat</option>
					<option value="FERRY">Ferry</option>
				</select>
			</div>

			{isLoading && (
				<div className="text-sm text-muted-foreground py-8 text-center">
					Memuat data...
				</div>
			)}

			{!isLoading && routes.length === 0 && (
				<div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl">
					Tidak ada rute yang cocok.
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{routes.map((r) => (
					<div
						key={r.id}
						className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-xs">
						<div className="flex items-start justify-between gap-2">
							<div>
								<div className="flex items-center gap-1.5 mb-1">
									{r.routeType === "FERRY" ? (
										<ShipIcon className="w-3.5 h-3.5 text-blue-500" />
									) : (
										<BusIcon className="w-3.5 h-3.5 text-amber-600" />
									)}
									<span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
										{r.routeType === "FERRY" ? "Ferry" : "Darat"}
									</span>
								</div>
								<h3 className="font-semibold text-foreground text-sm">
									{r.transportName}
								</h3>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							{r.routeCities.map((c, idx) => (
								<span key={idx} className="flex items-center gap-1.5">
									<span className="px-2 py-0.5 bg-muted/40 rounded-full">{c}</span>
									{idx < r.routeCities.length - 1 && <span>→</span>}
								</span>
							))}
						</div>

						{r.vehicleType && (
							<div className="text-xs text-muted-foreground">
								Armada: {r.vehicleType}
							</div>
						)}

						<div className="flex items-center justify-between pt-2 border-t border-border text-xs">
							<span className="font-semibold text-foreground">
								{formatPrice(r.priceMin, r.priceMax, r.priceRaw)}
							</span>
							{r.operationalHour && (
								<span className="flex items-center gap-1 text-muted-foreground">
									<ClockIcon className="w-3 h-3" />
									{r.operationalHour}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
