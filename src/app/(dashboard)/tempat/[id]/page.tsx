"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	MapPinIcon,
	StarIcon,
	ClockIcon,
	TagIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
	WISATA: "Destinasi Wisata",
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

type IssueSummary = {
	category: string;
	negativeCount: number;
	totalMentions: number;
	gapScore: number;
};

type Review = {
	id: string;
	reviewerName: string | null;
	reviewerRating: number | null;
	reviewText: string | null;
	publishedAtRaw: string | null;
	isNegativeSource?: boolean;
	issueTags?: { category: string; confidence: number }[];
};

type PlaceDetail = {
	id: string;
	placeCode: string;
	name: string;
	category: string;
	subtype: string | null;
	priceMin: number | null;
	priceMax: number | null;
	priceRaw: string | null;
	address: string | null;
	operationalHour: string | null;
	rating: number | null;
	facilitiesOrActivities: string | null;
	description: string | null;
	ownershipType: string;
	issueSummaries: IssueSummary[];
	reviews: Review[];
};

function formatPrice(min: number | null, max: number | null) {
	if (min === null && max === null) return "Tidak ada info harga";
	if (min === 0 && max === 0) return "Gratis";
	if (min === max) return `Rp ${min?.toLocaleString("id-ID")}`;
	return `Rp ${min?.toLocaleString("id-ID")} - Rp ${max?.toLocaleString("id-ID")}`;
}

export default function PlaceDetailPage() {
	const params = useParams<{ id: string }>();
	const [place, setPlace] = useState<PlaceDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		fetch(`/api/places/${params.id}`)
			.then((res) => {
				if (!res.ok) throw new Error("not found");
				return res.json();
			})
			.then((data) => {
				setPlace(data);
				setIsLoading(false);
			})
			.catch(() => {
				setNotFound(true);
				setIsLoading(false);
			});
	}, [params.id]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full p-10 text-sm text-muted-foreground">
				Memuat detail tempat...
			</div>
		);
	}

	if (notFound || !place) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-10 gap-3">
				<p className="text-sm text-muted-foreground">Tempat tidak ditemukan.</p>
				<Link href="/dashboard" className="text-sm text-primary hover:underline">
					Kembali ke peta
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<Link
				href="/dashboard"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
				<ArrowLeftIcon className="w-4 h-4" />
				Kembali ke peta
			</Link>

			<div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-xs">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
					<div>
						<span className="text-xs font-semibold text-primary uppercase tracking-wide">
							{CATEGORY_LABEL[place.category] ?? place.category}
							{place.subtype ? ` · ${place.subtype}` : ""}
						</span>
						<h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
							{place.name}
						</h1>
					</div>
					{place.rating !== null && (
						<div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-lg shrink-0">
							<StarIcon className="w-4 h-4 fill-amber-500 text-amber-500" />
							<span className="font-semibold text-sm">{place.rating.toFixed(1)}</span>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
					<div className="flex items-start gap-2">
						<MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
						<div>
							<div className="text-xs text-muted-foreground">Alamat</div>
							<div className="text-sm text-foreground">{place.address ?? "-"}</div>
						</div>
					</div>
					<div className="flex items-start gap-2">
						<ClockIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
						<div>
							<div className="text-xs text-muted-foreground">Jam Operasional</div>
							<div className="text-sm text-foreground">
								{place.operationalHour ?? "-"}
							</div>
						</div>
					</div>
					<div className="flex items-start gap-2">
						<TagIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
						<div>
							<div className="text-xs text-muted-foreground">Harga</div>
							<div className="text-sm text-foreground">
								{formatPrice(place.priceMin, place.priceMax)}
							</div>
						</div>
					</div>
				</div>

				{place.facilitiesOrActivities && (
					<div className="mt-4 pt-4 border-t border-border">
						<div className="text-xs text-muted-foreground mb-1">
							Fasilitas / Aktivitas
						</div>
						<div className="text-sm text-foreground">
							{place.facilitiesOrActivities}
						</div>
					</div>
				)}

				{place.description && (
					<div className="mt-4 pt-4 border-t border-border">
						<div className="text-xs text-muted-foreground mb-1">Deskripsi</div>
						<div className="text-sm text-foreground">{place.description}</div>
					</div>
				)}
			</div>

			{/* AI-derived weaknesses */}
			<div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-base font-semibold text-foreground flex items-center gap-2">
						<AlertTriangleIcon className="w-4 h-4 text-red-600" />
						Kelemahan (Hasil Analisis AI)
					</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						Ringkasan otomatis dari ulasan pengunjung.
					</p>
				</div>

				<div className="p-6">
					{place.issueSummaries.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Belum ada cukup data ulasan yang dianalisis untuk tempat ini.
						</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{place.issueSummaries.map((s) => (
								<div
									key={s.category}
									className="border border-border rounded-xl p-4 flex items-center justify-between">
									<div>
										<div className="font-medium text-sm text-foreground">
											{ISSUE_LABEL[s.category] ?? s.category}
										</div>
										<div className="text-xs text-muted-foreground mt-0.5">
											{s.negativeCount}/{s.totalMentions} ulasan menyebut ini secara
											negatif
										</div>
									</div>
									<span
										className={`text-sm font-bold px-2.5 py-1 rounded-full shrink-0 ${
											s.gapScore >= 0.6
												? "bg-red-50 text-red-700 border border-red-100"
												: s.gapScore >= 0.3
													? "bg-amber-50 text-amber-700 border border-amber-100"
													: "bg-green-50 text-green-700 border border-green-100"
										}`}>
										{Math.round(s.gapScore * 100)}%
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Reviews */}
			<div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-base font-semibold text-foreground">
						Ulasan Pengunjung
					</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						Ulasan bertanda merah adalah sumber temuan &quot;Kelemahan (Hasil Analisis AI)&quot;
						di atas.
					</p>
				</div>
				<div className="divide-y divide-border">
					{place.reviews.length === 0 && (
						<p className="text-sm text-muted-foreground p-6">Belum ada ulasan.</p>
					)}
					{place.reviews.map((r) => (
						<div
							key={r.id}
							className={`p-5 ${
								r.isNegativeSource ? "bg-red-50/60 border-l-4 border-l-red-400" : ""
							}`}>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-foreground">
									{r.reviewerName ?? "Anonim"}
								</span>
								<div className="flex items-center gap-1">
									{r.reviewerRating !== null && (
										<>
											<StarIcon className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
											<span className="text-xs text-muted-foreground">
												{r.reviewerRating}
											</span>
										</>
									)}
								</div>
							</div>

							{r.isNegativeSource && r.issueTags && r.issueTags.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mt-2">
									{r.issueTags.map((t, idx) => (
										<span
											key={idx}
											className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
											<AlertTriangleIcon className="w-3 h-3" />
											{ISSUE_LABEL[t.category] ?? t.category}
										</span>
									))}
								</div>
							)}

							{r.reviewText && (
								<p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
									{r.reviewText}
								</p>
							)}
							{r.publishedAtRaw && (
								<span className="text-[10px] text-muted-foreground/70 mt-1 block">
									{r.publishedAtRaw}
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
