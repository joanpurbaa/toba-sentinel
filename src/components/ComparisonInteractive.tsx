"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckIcon,
	XIcon,
	PackageIcon,
	AlertTriangleIcon,
	ZapIcon,
	ClipboardXIcon,
} from "lucide-react";

type Mode = "lama" | "pharmasync";

const rackData: Record<Mode, string[]> = {
	lama: Array(15).fill("unknown"),
	pharmasync: [
		"aman",
		"aman",
		"aman",
		"menipis",
		"aman",
		"aman",
		"kritis",
		"aman",
		"aman",
		"menipis",
		"aman",
		"aman",
		"aman",
		"aman",
		"kritis",
	],
};

const rackColor: Record<string, string> = {
	unknown: "bg-slate-200",
	aman: "bg-primary",
	menipis: "bg-amber-400",
	kritis: "bg-red-400",
};

const metrics = {
	lama: [
		{ label: "Akurasi Stok", value: 62, suffix: "%" },
		{ label: "Deteksi Stok Kritis", value: 15, suffix: "% dalam 1 hari" },
		{ label: "Human Error", value: 78, suffix: "%" },
	],
	pharmasync: [
		{ label: "Akurasi Stok", value: 99.8, suffix: "%" },
		{ label: "Deteksi Stok Kritis", value: 100, suffix: "% real-time" },
		{ label: "Human Error", value: 3, suffix: "%" },
	],
};

const flowSteps: Record<Mode, string[]> = {
	lama: [
		"Input manual",
		"Rekap spreadsheet",
		"Sinkron 1-2 hari",
		"Stok kosong tanpa disadari",
	],
	pharmasync: [
		"Update dari distribusi",
		"Sinkron otomatis",
		"Dashboard real-time",
		"Alert sebelum kritis",
	],
};

const batchCount = 5;

const laneLabels: Record<Mode, { start: string; end: string }> = {
	lama: { start: "Gudang", end: "Klinik (terlambat)" },
	pharmasync: { start: "Gudang", end: "Klinik (real-time)" },
};

const perimeterBadges: Record<
	Mode,
	{
		icon: typeof AlertTriangleIcon;
		label: string;
		sublabel: string;
		className: string;
	}[]
> = {
	lama: [
		{
			icon: ClipboardXIcon,
			label: "Rekap Manual",
			sublabel: "Rawan human error",
			className: "-top-5 -left-5",
		},
		{
			icon: AlertTriangleIcon,
			label: "Stok Tak Terdeteksi",
			sublabel: "Baru ketahuan telat",
			className: "-bottom-5 -right-5",
		},
	],
	pharmasync: [
		{
			icon: ZapIcon,
			label: "Update Instan",
			sublabel: "Sinkron otomatis",
			className: "-top-5 -left-5",
		},
		{
			icon: CheckIcon,
			label: "Terverifikasi",
			sublabel: "Tervalidasi sistem",
			className: "-bottom-5 -right-5",
		},
	],
};

function PerimeterBadge({
	icon: Icon,
	label,
	sublabel,
	className,
	isOld,
}: {
	icon: typeof AlertTriangleIcon;
	label: string;
	sublabel: string;
	className: string;
	isOld: boolean;
}) {
	return (
		<motion.div
			key={`${label}-${isOld}`}
			initial={{ opacity: 0, scale: 0.8, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
			transition={{
				opacity: { duration: 0.4 },
				scale: { duration: 0.4 },
				y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
			}}
			className={`absolute z-20 hidden md:flex items-center gap-2.5 bg-white rounded-xl border shadow-lg px-3.5 py-2.5 ${className} ${
				isOld
					? "border-red-100 shadow-red-900/5"
					: "border-primary/10 shadow-primary/5"
			}`}>
			<span
				className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
					isOld ? "bg-[#FF6347]" : "bg-primary"
				}`}>
				<Icon className="w-4 h-4 text-white" />
			</span>
			<div className="text-left">
				<p className="text-xs font-bold text-slate-900 leading-none">{label}</p>
				<p className="text-[10px] text-slate-400 mt-1 leading-none">{sublabel}</p>
			</div>
		</motion.div>
	);
}

function BatchLane({ mode }: { mode: Mode }) {
	const isOld = mode === "lama";
	const items = Array.from({ length: batchCount });

	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
					Pergerakan Batch Obat
				</p>
				<span
					className={`text-[11px] font-semibold ${isOld ? "text-red-500" : "text-primary"}`}>
					{isOld ? "Tersendat" : "Live"}
				</span>
			</div>

			<div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
				<span>{laneLabels[mode].start}</span>
				<span>{laneLabels[mode].end}</span>
			</div>

			<div className="relative h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
				<div className="absolute inset-y-1/2 left-3 right-3 h-px bg-slate-200" />

				{items.map((_, i) => (
					<motion.div
						key={`${mode}-batch-${i}`}
						className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center shadow-sm ${
							isOld ? "bg-white border border-red-200" : "bg-primary"
						}`}
						initial={{ left: "2%" }}
						animate={
							isOld
								? {
										left: ["2%", "2%", "22%", "22%", "22%", "40%", "38%", "55%", "55%"],
									}
								: { left: ["2%", "96%"] }
						}
						transition={
							isOld
								? {
										duration: 4.5,
										times: [0, 0.15, 0.25, 0.45, 0.55, 0.7, 0.78, 0.92, 1],
										repeat: Infinity,
										delay: i * 0.9,
										ease: "easeInOut",
									}
								: {
										duration: 3,
										repeat: Infinity,
										delay: i * 0.55,
										ease: "linear",
									}
						}>
						{isOld ? (
							<PackageIcon className="w-3.5 h-3.5 text-red-400" />
						) : (
							<PackageIcon className="w-3.5 h-3.5 text-primary-foreground" />
						)}
					</motion.div>
				))}

				{!isOld && (
					<motion.div
						className="absolute top-1/2 -translate-y-1/2 right-3"
						initial={{ opacity: 0.4 }}
						animate={{ opacity: [0.4, 1, 0.4] }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
						<CheckIcon className="w-4 h-4 text-primary" />
					</motion.div>
				)}
			</div>

			<p className="text-[11px] text-slate-400 mt-2">
				{isOld
					? "Batch tertahan di tengah jalur — tidak ada visibilitas posisi sampai driver melapor manual."
					: "Batch bergerak konsisten dengan tracking GPS, status ter-update otomatis setiap saat."}
			</p>
		</div>
	);
}

export default function ComparisonInteractive() {
	const [mode, setMode] = useState<Mode>("pharmasync");
	const isOld = mode === "lama";

	return (
		<div className="max-w-4xl mx-auto">
			<div className="flex justify-center mb-10">
				<div className="grid grid-cols-2 bg-slate-100 rounded-full p-1 relative w-72">
					<motion.div
						className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm"
						animate={{ x: isOld ? 0 : "100%" }}
						transition={{ type: "spring", stiffness: 400, damping: 32 }}
					/>
					<button
						onClick={() => setMode("lama")}
						className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-colors text-center cursor-pointer ${
							isOld ? "text-slate-900" : "text-slate-400"
						}`}>
						Cara Lama
					</button>
					<button
						onClick={() => setMode("pharmasync")}
						className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-colors text-center cursor-pointer ${
							!isOld ? "text-primary" : "text-slate-400"
						}`}>
						Pharmasync
					</button>
				</div>
			</div>

			<div className="relative rounded-2xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8">
				<AnimatePresence mode="wait">
					{perimeterBadges[mode].map((badge) => (
						<PerimeterBadge
							key={`${mode}-${badge.label}`}
							icon={badge.icon}
							label={badge.label}
							sublabel={badge.sublabel}
							className={badge.className}
							isOld={isOld}
						/>
					))}
				</AnimatePresence>
				<div className="grid sm:grid-cols-2 gap-8 sm:gap-10">
					<div>
						<div className="flex items-center justify-between mb-1">
							<p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
								Visualisasi Gudang
							</p>
							<span className="text-[11px] text-slate-400">15 titik stok</span>
						</div>
						<p className="text-xs text-slate-400 mb-3">
							Tiap kotak mewakili 1 rak obat — warna menunjukkan status stoknya.
						</p>

						<div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
							<span className="flex items-center gap-1.5">
								<span
									className={`w-2.5 h-2.5 rounded-sm ${isOld ? "bg-slate-200" : "bg-primary"}`}
								/>
								{isOld ? "Tidak diketahui" : "Aman"}
							</span>
							<span className="flex items-center gap-1.5">
								<span
									className={`w-2.5 h-2.5 rounded-sm ${isOld ? "bg-slate-200" : "bg-amber-400"}`}
								/>
								Menipis
							</span>
							<span className="flex items-center gap-1.5">
								<span
									className={`w-2.5 h-2.5 rounded-sm ${isOld ? "bg-slate-200" : "bg-red-400"}`}
								/>
								Kritis
							</span>
						</div>

						<div className="space-y-2">
							{["A", "B", "C"].map((rak, rowIdx) => (
								<div key={rak} className="flex items-center gap-2">
									<span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">
										{rak}
									</span>
									<div className="grid grid-cols-5 gap-2 flex-1">
										{rackData[mode].slice(rowIdx * 5, rowIdx * 5 + 5).map((status, i) => (
											<motion.div
												key={`${mode}-${rowIdx}-${i}`}
												initial={{ opacity: 0, scale: 0.6 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ duration: 0.3, delay: (rowIdx * 5 + i) * 0.03 }}
												className={`aspect-square rounded-md ${rackColor[status]}`}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					<div>
						<p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
							Metrik Operasional
						</p>
						<div className="mt-8 pt-8 border-t border-slate-100">
							<BatchLane mode={mode} />
						</div>
						<div className="space-y-4">
							{metrics[mode].map((m, i) => (
								<div key={m.label}>
									<div className="flex justify-between text-sm mb-1.5">
										<span className="text-slate-600 font-medium">{m.label}</span>
										<span
											className={`font-bold ${isOld ? "text-slate-500" : "text-primary"}`}>
											{m.value}
											{m.suffix}
										</span>
									</div>
									<div className="h-2 rounded-full bg-slate-100 overflow-hidden">
										<motion.div
											key={`${mode}-${m.label}`}
											initial={{ width: 0 }}
											animate={{ width: `${Math.min(m.value, 100)}%` }}
											transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
											className={`h-full rounded-full ${isOld ? "bg-slate-300" : "bg-primary"}`}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="border-t border-slate-100 mt-8 pt-8">
					<p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-5">
						Alur Kerja
					</p>
					<AnimatePresence mode="wait">
						<motion.div
							key={mode}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.25 }}
							className="flex flex-col sm:flex-row items-stretch gap-2">
							{flowSteps[mode].map((step, i) => (
								<div key={step} className="flex items-center gap-2 flex-1">
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: i * 0.08, duration: 0.4 }}
										className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium flex-1 ${
											isOld ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"
										}`}>
										{isOld ? (
											<XIcon className="w-3.5 h-3.5 shrink-0" />
										) : (
											<CheckIcon className="w-3.5 h-3.5 shrink-0" />
										)}
										{step}
									</motion.div>
									{i < flowSteps[mode].length - 1 && (
										<span className="hidden sm:block text-slate-300 text-xs">→</span>
									)}
								</div>
							))}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
