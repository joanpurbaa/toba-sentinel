"use client";

import { motion } from "framer-motion";
import { BotIcon } from "lucide-react";

export default function MiniAiChat() {
	return (
		<div className="rounded-xl bg-white border border-slate-100 p-4">
			<div className="flex items-center gap-1.5 mb-3">
				<span className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shrink-0">
					<BotIcon className="w-3 h-3 text-white" />
				</span>
				<span className="text-[11px] font-semibold text-slate-500">
					Pharmasync AI
				</span>
			</div>

			<div className="space-y-2">
				<motion.div
					initial={{ opacity: 0, x: 10 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="ml-auto w-fit max-w-[80%] bg-primary text-white text-[11px] rounded-xl rounded-tr-sm px-3 py-1.5">
					stok amoxicillin berapa?
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: -10 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4, delay: 0.5 }}
					className="w-fit max-w-[85%] bg-slate-100 text-slate-600 text-[11px] rounded-xl rounded-tl-sm px-3 py-1.5">
					Tersedia 8 box, status Menipis.
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.3, delay: 0.9 }}
					className="flex items-center gap-1 pl-1">
					{[0, 1, 2].map((i) => (
						<motion.span
							key={i}
							animate={{ y: [0, -3, 0] }}
							transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
							className="w-1 h-1 rounded-full bg-slate-300"
						/>
					))}
				</motion.div>
			</div>
		</div>
	);
}
