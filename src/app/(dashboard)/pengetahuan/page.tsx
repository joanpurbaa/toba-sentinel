"use client";

import { useEffect, useState } from "react";
import { SearchIcon, BookOpenIcon, ExternalLinkIcon } from "lucide-react";

interface Article {
	id: string;
	category: string;
	title: string;
	kabupaten: string | null;
	content: string;
	sourceUrl: string | null;
}

export default function Knowledge() {
	const [articles, setArticles] = useState<Article[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsLoading(true);
			const params = new URLSearchParams();
			if (query) params.set("q", query);
			fetch(`/api/knowledge?${params.toString()}`)
				.then((res) => res.json())
				.then((data) => {
					setArticles(data);
					setIsLoading(false);
				});
		}, 300);
		return () => clearTimeout(timeout);
	}, [query]);

	return (
		<div className="flex flex-col w-full p-4 sm:p-6 space-y-6">
			<div className="space-y-1">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					Pengetahuan Wisata
				</h1>
				<p className="text-sm text-muted-foreground font-medium">
					Cari informasi sejarah, budaya, dan seputar Danau Toba. Pencarian kata
					kunci langsung dari artikel sumber.
				</p>
			</div>

			<div className="relative">
				<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					placeholder="Cari topik, misal: sejarah, legenda, letusan..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			{isLoading && (
				<div className="text-sm text-muted-foreground py-8 text-center">
					Mencari...
				</div>
			)}

			{!isLoading && articles.length === 0 && (
				<div className="text-sm text-muted-foreground py-8 text-center bg-card border border-border rounded-2xl">
					Tidak ada artikel yang cocok dengan pencarian.
				</div>
			)}

			<div className="space-y-3">
				{articles.map((a) => {
					const isExpanded = expandedId === a.id;
					return (
						<div
							key={a.id}
							className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
							<button
								onClick={() => setExpandedId(isExpanded ? null : a.id)}
								className="w-full text-left p-5 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors">
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										<BookOpenIcon className="w-3.5 h-3.5 text-primary" />
										{a.kabupaten && (
											<span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
												{a.kabupaten}
											</span>
										)}
									</div>
									<h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
									{!isExpanded && (
										<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
											{a.content}
										</p>
									)}
								</div>
							</button>

							{isExpanded && (
								<div className="px-5 pb-5 space-y-3">
									<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
										{a.content}
									</p>
									{a.sourceUrl && (
										<a
											href={a.sourceUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
											Baca sumber asli
											<ExternalLinkIcon className="w-3 h-3" />
										</a>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
