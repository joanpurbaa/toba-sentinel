"use client";

import dynamic from "next/dynamic";

const DashboardMap = dynamic(() => import("@/components/dashboardMap"), { ssr: false });

export default function Dashboard() {
	return (
		<div className="flex flex-col w-full h-full p-4 sm:p-6 space-y-6">
			<div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-xs">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Peta Ekosistem Danau Toba
				</h1>
				<p className="text-sm text-muted-foreground font-medium mt-1">
					Pantau sebaran destinasi, hotel, dan kuliner. Warna titik menunjukkan
					kualitas rating — merah perlu perhatian, hijau baik.
				</p>
			</div>

			<div className="flex-1 min-h-[600px] bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
				<DashboardMap />
			</div>
		</div>
	);
}
