"use client";

import { motion } from "framer-motion";

const rackStatus = [
	"aman",
	"aman",
	"aman",
	"menipis",
	"aman",
	"aman",
	"aman",
	"kritis",
	"aman",
	"aman",
	"aman",
	"menipis",
	"aman",
	"aman",
	"kritis",
	"aman",
	"aman",
	"aman",
];

const colorMap: Record<string, string> = {
	aman: "bg-white/90",
	menipis: "bg-amber-300",
	kritis: "bg-red-300",
};

export default function MiniWarehouseGrid() {
	return (
		<div className="rounded-xl bg-white/10 border border-white/10 p-4">
			<div className="flex items-center justify-between mb-3">
				<span className="text-[11px] font-semibold text-white/70">
					Live Rack Status
				</span>
				<span className="flex items-center gap-1 text-[10px] font-semibold text-white/70">
					<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
					Sync
				</span>
			</div>
			<div className="grid grid-cols-6 gap-1.5">
				{rackStatus.map((status, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, scale: 0.5 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.3, delay: i * 0.03 }}
						className="relative">
						<motion.div
							animate={status !== "aman" ? { opacity: [1, 0.4, 1] } : {}}
							transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
							className={`aspect-square rounded-sm ${colorMap[status]}`}
						/>
					</motion.div>
				))}
			</div>
		</div>
	);
}
