"use client";

import { useEffect, useState } from "react";
import { SendIcon, CheckCircle2Icon } from "lucide-react";

const ISSUE_OPTIONS = [
	{ value: "PARKIR", label: "Parkir" },
	{ value: "TOILET", label: "Toilet" },
	{ value: "AKSES", label: "Akses Jalan" },
	{ value: "KEBERSIHAN", label: "Kebersihan" },
	{ value: "HARGA", label: "Harga" },
	{ value: "PELAYANAN", label: "Pelayanan" },
	{ value: "LAINNYA", label: "Lainnya" },
];

type Place = { id: string; name: string; category: string };
type UserOption = { id: string; name: string };

export default function LaporPage() {
	const [places, setPlaces] = useState<Place[]>([]);
	const [users, setUsers] = useState<UserOption[]>([]);
	const [placeId, setPlaceId] = useState("");
	const [filedById, setFiledById] = useState("");
	const [category, setCategory] = useState("PARKIR");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/places/map")
			.then((res) => res.json())
			.then((data: Place[]) =>
				setPlaces([...data].sort((a, b) => a.name.localeCompare(b.name)))
			);
		fetch("/api/users?role=UMKM")
			.then((res) => res.json())
			.then((data) => setUsers(data));
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!placeId || !filedById || !title || !description) {
			setError("Semua field wajib diisi.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/reports", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ placeId, filedById, category, title, description }),
			});

			if (!res.ok) throw new Error();

			setSuccess(true);
			setTitle("");
			setDescription("");
		} catch {
			setError("Gagal mengirim laporan. Coba lagi.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (success) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-10 gap-4 text-center">
				<CheckCircle2Icon className="w-12 h-12 text-primary" />
				<h2 className="text-lg font-semibold text-foreground">Laporan Terkirim</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					Laporan kamu sudah masuk ke antrian tinjauan pemerintah.
				</p>
				<button
					onClick={() => setSuccess(false)}
					className="text-sm font-semibold text-primary hover:underline"
				>
					Kirim laporan lain
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6 max-w-2xl">
			<div className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Laporkan Kebutuhan Infrastruktur
				</h1>
				<p className="text-sm text-muted-foreground font-medium">
					Sampaikan kebutuhan perbaikan langsung ke pemerintah — parkir, akses jalan, toilet, dan lainnya.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5"
			>
				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">Akun Pelapor</label>
					<select
						value={filedById}
						onChange={(e) => setFiledById(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
					>
						<option value="">Pilih akun...</option>
						{users.map((u) => (
							<option key={u.id} value={u.id}>
								{u.name}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">Tempat</label>
					<select
						value={placeId}
						onChange={(e) => setPlaceId(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
					>
						<option value="">Pilih tempat...</option>
						{places.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">Kategori Kebutuhan</label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
					>
						{ISSUE_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">Judul Laporan</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Contoh: Lahan parkir sempit saat akhir pekan"
						className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
					/>
				</div>

				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">Deskripsi</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={4}
						placeholder="Jelaskan detail kebutuhan atau masalah yang dihadapi..."
						className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground resize-none"
					/>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-secondary disabled:opacity-60 text-secondary-foreground text-sm font-semibold rounded-lg transition-colors"
				>
					<SendIcon className="w-4 h-4" />
					{isSubmitting ? "Mengirim..." : "Kirim Laporan"}
				</button>
			</form>
		</div>
	);
}