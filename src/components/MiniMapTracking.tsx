"use client";

import { motion } from "framer-motion";
import { CarIcon, MapPinIcon } from "lucide-react";

const PATH_D = "M 20 140 C 60 140 60 90 100 90 S 160 40 200 40 S 260 70 300 70";

export default function MiniMapTracking() {
	return (
		<div className="relative w-full h-[180px] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
			<svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full">
				<pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
					<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
				</pattern>
				<rect width="320" height="180" fill="url(#mapGrid)" />

				<path
					d={PATH_D}
					fill="none"
					stroke="#cbd5e1"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				<path
					d={PATH_D}
					fill="none"
					stroke="#2F80ED"
					strokeWidth="4"
					strokeLinecap="round"
					strokeDasharray="1 12"
				/>

				<circle cx="20" cy="140" r="5" fill="#16324F" />

				<g transform="translate(300, 70)">
					<motion.circle
						r="14"
						fill="#2F80ED"
						fillOpacity="0.15"
						animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
						transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
					/>
					<MapPinIcon
						x="-9"
						y="-20"
						width="18"
						height="18"
						fill="#2F80ED"
						stroke="white"
						strokeWidth="1"
					/>
				</g>

				<g>
					<animateMotion
						dur="4s"
						repeatCount="indefinite"
						path={PATH_D}
						rotate="auto"
					/>
					<circle r="10" fill="white" stroke="#2F80ED" strokeWidth="2" />
					<foreignObject x="-7" y="-7" width="14" height="14">
						<div className="w-full h-full flex items-center justify-center">
							<CarIcon className="w-3 h-3 text-primary" strokeWidth={2.5} />
						</div>
					</foreignObject>
				</g>
			</svg>

			<div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-600">
				<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
				Agus Salim &bull; Menuju Klinik Medan
			</div>
		</div>
	);
}
