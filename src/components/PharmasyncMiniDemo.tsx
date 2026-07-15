"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
	LayoutDashboardIcon,
	PackageIcon,
	TruckIcon,
	UsersIcon,
	Building2Icon,
	HistoryIcon,
	Boxes,
	BotIcon,
} from "lucide-react";

const NAV_GROUPS = [
	{
		label: "Operasional",
		items: [
			{ key: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
			{ key: "stok", label: "Stok Barang", icon: PackageIcon },
			{ key: "distribusi", label: "Distribusi", icon: TruckIcon },
			{ key: "petugas", label: "Petugas", icon: UsersIcon },
		],
	},
	{
		label: "Manajemen Data",
		items: [
			{ key: "mitra", label: "Mitra", icon: Building2Icon },
			{ key: "riwayat", label: "Riwayat", icon: HistoryIcon },
			{ key: "gudang3d", label: "Visualisasi 3D", icon: Boxes },
		],
	},
	{
		label: "Asisten AI",
		items: [{ key: "ai", label: "Chat Pharmasync AI", icon: BotIcon }],
	},
];

const stokBarang = [
	{
		nama: "Paracetamol 500mg",
		sku: "POK-1001",
		kategori: "Farmasi",
		stok: 20,
		status: "Aman",
		exp: "12 Jun 2028",
	},
	{
		nama: "Amoxicillin Syrup 60ml",
		sku: "MED-AMX-60",
		kategori: "Farmasi",
		stok: 8,
		status: "Menipis",
		exp: "03 Feb 2027",
	},
	{
		nama: "Vitamin C 1000mg",
		sku: "VIT-C-100",
		kategori: "Suplemen",
		stok: 2,
		status: "Kritis",
		exp: "20 Sep 2027",
	},
	{
		nama: "Ibuprofen 400mg",
		sku: "IBU-400",
		kategori: "Farmasi",
		stok: 35,
		status: "Aman",
		exp: "15 Nov 2028",
	},
	{
		nama: "Masker Bedah 3-Ply",
		sku: "APD-MSK-3",
		kategori: "Alat Medis",
		stok: 5,
		status: "Kritis",
		exp: "-",
	},
];

const distribusi = [
	{
		id: "TRX-17203-O",
		item: "Paracetamol · 1 Box",
		tujuan: "Klinik Medan Medical Center",
		jadwal: "12 Jul 2026, 08:11",
		driver: "Agus Salim",
		status: "Selesai",
	},
	{
		id: "TRX-69482-O",
		item: "Paracetamol · 14 Box",
		tujuan: "Gwen Dental Bandung",
		jadwal: "11 Jul 2026, 20:09",
		driver: "Agus Salim",
		status: "Selesai",
	},
	{
		id: "TRX-88110-O",
		item: "Amoxicillin Syrup · 6 Box",
		tujuan: "Klinik Medan Medical Center",
		jadwal: "14 Jul 2026, 09:30",
		driver: "Budi Santoso",
		status: "Dikirim",
	},
	{
		id: "TRX-90341-O",
		item: "Vitamin C · 3 Box",
		tujuan: "Gwen Dental Bandung",
		jadwal: "16 Jul 2026, 13:00",
		driver: "Belum ditentukan",
		status: "Dijadwalkan",
	},
];

const petugas = [
	{
		nama: "Agus Salim",
		telp: "0812-990-1234",
		kendaraan: "B 1234 ABC · Kargo Kering",
		status: "Aktif",
	},
	{
		nama: "Budi Santoso",
		telp: "0813-772-5566",
		kendaraan: "B 5678 XYZ · Kargo Dingin",
		status: "Aktif",
	},
	{
		nama: "Rian Hidayat",
		telp: "0815-441-9087",
		kendaraan: "Belum ditentukan",
		status: "Nonaktif",
	},
];

const mitra = [
	{
		nama: "Gwen Dental Bandung",
		alamat: "Jl. Sukhirman No.5/42, Dungus Cariang, Andir, Kota Bandung",
		telp: "0857-7X299999",
		status: "Kredensial Terbaca",
	},
	{
		nama: "Klinik Medan Medical Center",
		alamat: "Kp. Medan Baru Blok BB - 32, Jl. Mahakarya No.87, Hamdan, Medan",
		telp: "0623-7X230000",
		status: "Kredensial Terbaca",
	},
];

const riwayat = [
	{
		waktu: "14 Jul 2026, 09:31",
		aktivitas: "Pengiriman diperbarui",
		oleh: "Agus Salim",
		target: "Paracetamol → Klinik Medan Medical Center",
		dampak: "+0.0s",
	},
	{
		waktu: "13 Jul 2026, 20:09",
		aktivitas: "Pengiriman selesai",
		oleh: "Agus Salim",
		target: "Paracetamol → Gwen Dental Bandung",
		dampak: "-0.4s",
	},
	{
		waktu: "13 Jul 2026, 14:02",
		aktivitas: "Stok diperbarui otomatis",
		oleh: "Sistem",
		target: "Amoxicillin Syrup",
		dampak: "Baru saja",
	},
];

const gudang3d = [
	{ rak: "Rak A1", isi: "Paracetamol", status: "Aman" },
	{ rak: "Rak A2", isi: "Ibuprofen", status: "Aman" },
	{ rak: "Rak B1", isi: "Amoxicillin Syrup", status: "Menipis" },
	{ rak: "Rak B2", isi: "Vitamin C", status: "Kritis" },
	{ rak: "Rak C1", isi: "Masker Bedah", status: "Kritis" },
	{ rak: "Rak C2", isi: "Kosong", status: "Aman" },
];

const statusStyle: Record<string, string> = {
	Aman: "bg-primary/10 text-primary",
	Menipis: "bg-amber-50 text-amber-600",
	Kritis: "bg-red-50 text-red-500",
	Selesai: "bg-primary/10 text-primary",
	Dikirim: "bg-amber-50 text-amber-600",
	Dijadwalkan: "bg-slate-100 text-slate-500",
	Aktif: "bg-primary/10 text-primary",
	Nonaktif: "bg-slate-100 text-slate-500",
	"Kredensial Terbaca": "bg-primary/10 text-primary",
};

function Badge({ value }: { value: string }) {
	return (
		<span
			className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
				statusStyle[value] || "bg-slate-100 text-slate-500"
			}`}>
			{value}
		</span>
	);
}

function Th({ children }: { children: ReactNode }) {
	return (
		<th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
			{children}
		</th>
	);
}

function Td({
	children,
	className,
	wrap,
}: {
	children: ReactNode;
	className?: string;
	wrap?: boolean;
}) {
	return (
		<td
			className={`px-4 py-3 text-sm text-slate-700 ${
				wrap ? "whitespace-normal break-words" : "whitespace-nowrap"
			} ${className ?? ""}`}>
			{children}
		</td>
	);
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="mb-4">
			<h4 className="font-bold text-slate-900">{title}</h4>
			{subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
		</div>
	);
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
	return (
		<div className="overflow-x-auto rounded-xl border border-slate-100">
			<table className="w-full min-w-[560px]">
				<thead className="bg-slate-50 border-b border-slate-100">
					<tr>
						{head.map((h) => (
							<Th key={h}>{h}</Th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-50">{children}</tbody>
			</table>
		</div>
	);
}

function renderPanel(active: string) {
	switch (active) {
		case "dashboard":
			return (
				<div>
					<PanelHeader
						title="Dashboard"
						subtitle="Ringkasan statistik dan data secara keseluruhan"
					/>
					<div className="grid grid-cols-3 gap-3 mb-6">
						{[
							{ label: "Pengiriman Aktif", value: "4" },
							{ label: "Stok Kritis", value: "2" },
							{ label: "Mitra Terdaftar", value: "2" },
						].map((s) => (
							<div key={s.label} className="rounded-xl border border-slate-100 p-4">
								<div className="text-2xl font-bold text-slate-900">{s.value}</div>
								<div className="text-xs text-slate-400 mt-1">{s.label}</div>
							</div>
						))}
					</div>
					<p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
						Stok Mulai Menipis
					</p>
					<Table head={["Nama Item", "Stok", "Status"]}>
						{stokBarang
							.filter((s) => s.status !== "Aman")
							.map((s) => (
								<tr key={s.sku}>
									<Td>{s.nama}</Td>
									<Td>{s.stok} box</Td>
									<Td>
										<Badge value={s.status} />
									</Td>
								</tr>
							))}
					</Table>
				</div>
			);

		case "stok":
			return (
				<div>
					<PanelHeader
						title="Stok Barang"
						subtitle="Mengelola data persediaan barang"
					/>
					<Table
						head={[
							"Nama Item",
							"Kode SKU",
							"Kategori",
							"Stok",
							"Status",
							"Kadaluwarsa Terdekat",
						]}>
						{stokBarang.map((s) => (
							<tr key={s.sku}>
								<Td>{s.nama}</Td>
								<Td>{s.sku}</Td>
								<Td>{s.kategori}</Td>
								<Td>{s.stok} box</Td>
								<Td>
									<Badge value={s.status} />
								</Td>
								<Td>{s.exp}</Td>
							</tr>
						))}
					</Table>
				</div>
			);

		case "distribusi":
			return (
				<div>
					<PanelHeader
						title="Distribusi"
						subtitle="Memantau pengiriman dan pemantauan distribusi barang"
					/>
					<Table
						head={[
							"ID & Item",
							"Klinik Tujuan",
							"Jadwal Pengiriman",
							"Driver",
							"Status",
						]}>
						{distribusi.map((d) => (
							<tr key={d.id}>
								<Td>
									<div className="font-medium text-slate-900">{d.item}</div>
									<div className="text-xs text-slate-400">{d.id}</div>
								</Td>
								<Td>{d.tujuan}</Td>
								<Td>{d.jadwal}</Td>
								<Td>{d.driver}</Td>
								<Td>
									<Badge value={d.status} />
								</Td>
							</tr>
						))}
					</Table>
				</div>
			);

		case "petugas":
			return (
				<div>
					<PanelHeader
						title="Petugas"
						subtitle="Mengelola data petugas supir dan kendaraan"
					/>
					<Table head={["Nama", "No. Telepon", "Kendaraan", "Status"]}>
						{petugas.map((p) => (
							<tr key={p.nama}>
								<Td>{p.nama}</Td>
								<Td>{p.telp}</Td>
								<Td>{p.kendaraan}</Td>
								<Td>
									<Badge value={p.status} />
								</Td>
							</tr>
						))}
					</Table>
				</div>
			);

		case "mitra":
			return (
				<div>
					<PanelHeader
						title="Mitra"
						subtitle="Pendataan mitra baik klinik, puskesmas, atau rumah sakit"
					/>
					<Table
						head={["Nama Mitra / Klinik", "Alamat Lengkap", "No. Telepon", "Status"]}>
						{mitra.map((m) => (
							<tr key={m.nama}>
								<Td>{m.nama}</Td>
								<Td className="max-w-xs" wrap>
									{m.alamat}
								</Td>
								<Td>{m.telp}</Td>
								<Td>
									<Badge value={m.status} />
								</Td>
							</tr>
						))}
					</Table>
				</div>
			);

		case "riwayat":
			return (
				<div>
					<PanelHeader
						title="Riwayat"
						subtitle="Seluruh hasil kegiatan yang telah dilakukan"
					/>
					<Table head={["Waktu", "Aktivitas", "Oleh", "Target"]}>
						{riwayat.map((r, i) => (
							<tr key={i}>
								<Td>{r.waktu}</Td>
								<Td>{r.aktivitas}</Td>
								<Td>{r.oleh}</Td>
								<Td>{r.target}</Td>
							</tr>
						))}
					</Table>
				</div>
			);

		case "gudang3d":
			return (
				<div>
					<PanelHeader
						title="Visualisasi 3D Gudang"
						subtitle="Pantau rak, stok kritis, dan tampilan tata letak gudang secara real-time"
					/>
					<div className="grid grid-cols-3 gap-3">
						{gudang3d.map((g) => (
							<div
								key={g.rak}
								className="rounded-xl border border-slate-100 p-4 flex flex-col items-center text-center">
								<div
									className={`w-10 h-10 rounded-lg mb-3 ${
										g.status === "Aman"
											? "bg-primary/20"
											: g.status === "Menipis"
												? "bg-amber-200"
												: "bg-red-200"
									}`}
								/>
								<p className="text-sm font-semibold text-slate-900">{g.rak}</p>
								<p className="text-xs text-slate-400 mt-0.5 mb-2">{g.isi}</p>
								<Badge value={g.status} />
							</div>
						))}
					</div>
				</div>
			);

		case "ai":
			return (
				<div>
					<PanelHeader
						title="Chat Pharmasync AI"
						subtitle="Asisten AI read-only via Telegram"
					/>
					<div className="rounded-xl border border-slate-100 bg-slate-900 p-4 space-y-3 max-w-md">
						<div className="bg-slate-800 text-slate-100 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 w-fit max-w-[85%]">
							Saya bisa menampilkan data Stok Barang, Mitra/Klinik, dan Jadwal
							Pengiriman. Silakan tanyakan apa yang ingin Anda ketahui 🙂
						</div>
						<div className="bg-primary text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 w-fit max-w-[85%] ml-auto">
							kita udah ngirim obat kemana aja?
						</div>
						<div className="bg-slate-800 text-slate-100 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 w-fit max-w-[85%]">
							Total 2 pengiriman telah selesai, tujuan Klinik Medan Medical Center dan
							Gwen Dental Bandung, keduanya ditangani Agus Salim.
						</div>
					</div>
				</div>
			);

		default:
			return null;
	}
}

const FLAT_NAV_KEYS = NAV_GROUPS.flatMap((group) =>
	group.items.map((item) => item.key),
);
const AUTOPLAY_INTERVAL = 3200;
const RESUME_AFTER_IDLE = 6000;

export default function PharmasyncMiniDemo() {
	const [active, setActive] = useState("dashboard");
	const [isPaused, setIsPaused] = useState(false);

	const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (isPaused) return;

		autoplayRef.current = setInterval(() => {
			setActive((current) => {
				const idx = FLAT_NAV_KEYS.indexOf(current);
				const nextIdx = (idx + 1) % FLAT_NAV_KEYS.length;
				return FLAT_NAV_KEYS[nextIdx];
			});
		}, AUTOPLAY_INTERVAL);

		return () => {
			if (autoplayRef.current) clearInterval(autoplayRef.current);
		};
	}, [isPaused]);

	useEffect(() => {
		return () => {
			if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
		};
	}, []);

	const handleManualClick = (key: string) => {
		setActive(key);
		setIsPaused(true);

		if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
		resumeTimeoutRef.current = setTimeout(() => {
			setIsPaused(false);
		}, RESUME_AFTER_IDLE);
	};

	return (
		<div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 shadow-xl overflow-hidden bg-white">
			<div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
				<div className="flex gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-red-300" />
					<span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
					<span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
				</div>
				<span className="ml-3 text-xs font-medium text-slate-400">
					pharmasync.app/dashboard — demo interaktif (read-only)
				</span>
				{!isPaused && (
					<span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-primary">
						<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
						Auto demo
					</span>
				)}
			</div>

			<div className="flex h-[520px]">
				<aside className="w-44 sm:w-56 shrink-0 border-r border-slate-100 bg-white overflow-y-auto py-4">
					{NAV_GROUPS.map((group) => (
						<div key={group.label} className="mb-4 px-3">
							<p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-2 mb-1.5">
								{group.label}
							</p>
							<div className="space-y-0.5">
								{group.items.map(({ key, label, icon: Icon }) => (
									<button
										key={key}
										onClick={() => handleManualClick(key)}
										className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
											active === key
												? "bg-primary/10 text-primary"
												: "text-slate-500 hover:bg-slate-50"
										}`}>
										<Icon className="w-4 h-4 shrink-0" />
										<span className="truncate">{label}</span>
									</button>
								))}
							</div>
						</div>
					))}
				</aside>

				<section className="flex-1 min-w-0 overflow-y-auto p-6">
					{renderPanel(active)}
				</section>
			</div>
		</div>
	);
}
