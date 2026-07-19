"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
	BARU: "Baru",
	DITINJAU: "Ditinjau",
	DIPROSES: "Diproses",
	SELESAI: "Selesai",
	DITOLAK: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
	BARU: "bg-red-50 text-red-700 border-red-100",
	DITINJAU: "bg-amber-50 text-amber-700 border-amber-100",
	DIPROSES: "bg-blue-50 text-blue-700 border-blue-100",
	SELESAI: "bg-green-50 text-green-700 border-green-100",
	DITOLAK: "bg-gray-50 text-gray-500 border-gray-100",
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

type Report = {
	id: string;
	title: string;
	description: string;
	category: string;
	status: string;
	createdAt: string;
	responseNote: string | null;
	place: { id: string; name: string };
	filedBy: { name: string };
};

export default function LaporanPage() {
	const [reports, setReports] = useState<Report[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

	function load() {
		setIsLoading(true);
		fetch("/api/reports")
			.then((res) => res.json())
			.then((data) => {
				setReports(data);
				setIsLoading(false);
			});
	}

	useEffect(() => {
		load();
	}, []);

	async function updateStatus(id: string, status: string) {
		setUpdatingId(id);
		await fetch(`/api/reports/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status, responseNote: noteDrafts[id] }),
		});
		setUpdatingId(null);
		load();
	}

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Inbox Laporan UMKM
				</h1>
				<p className="text-sm text-muted-foreground font-medium">
					Tinjau dan tanggapi kebutuhan infrastruktur yang dilaporkan.
				</p>
			</div>

			{isLoading && (
				<div className="text-sm text-muted-foreground p-6">Memuat laporan...</div>
			)}

			{!isLoading && reports.length === 0 && (
				<div className="text-sm text-muted-foreground p-6 bg-card border border-border rounded-2xl">
					Belum ada laporan masuk.
				</div>
			)}

			<div className="space-y-4">
				{reports.map((r) => (
					<div
						key={r.id}
						className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
							<div>
								<div className="flex items-center gap-2">
									<span
										className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[r.status] ?? ""}`}>
										{STATUS_LABEL[r.status] ?? r.status}
									</span>
									<span className="text-xs text-muted-foreground">
										{ISSUE_LABEL[r.category] ?? r.category}
									</span>
								</div>
								<h3 className="font-semibold text-foreground mt-1.5">{r.title}</h3>
								<Link
									href={`/tempat/${r.place.id}`}
									className="text-xs text-primary hover:underline">
									{r.place.name}
								</Link>
								<p className="text-xs text-muted-foreground mt-0.5">
									Dilaporkan oleh {r.filedBy.name}
								</p>
							</div>
						</div>

						<p className="text-sm text-muted-foreground">{r.description}</p>

						{r.responseNote && (
							<div className="text-xs bg-muted/40 border border-border rounded-lg p-3 text-foreground">
								<span className="font-semibold">Catatan Tanggapan: </span>
								{r.responseNote}
							</div>
						)}

						<div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
							<input
								type="text"
								placeholder="Catatan tanggapan (opsional)"
								value={noteDrafts[r.id] ?? ""}
								onChange={(e) =>
									setNoteDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
								}
								className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground"
							/>
							<select
								disabled={updatingId === r.id}
								value={r.status}
								onChange={(e) => updateStatus(r.id, e.target.value)}
								className="px-3 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground">
								{Object.entries(STATUS_LABEL).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
