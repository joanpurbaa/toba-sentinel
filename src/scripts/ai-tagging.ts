// scripts/ai-tagging.ts
// One-off batch job: classify review text into issue categories, then aggregate per place.
// Run with: npx tsx scripts/ai-tagging.ts
// Requires: ANTHROPIC_API_KEY in .env, DATABASE_URL already migrated+seeded.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, IssueCategory } from "@prisma/client";
import { Pool } from "pg";
import { Agent, setGlobalDispatcher } from "undici";

// local model can be slow per batch — raise default fetch timeout well above the 300s default
setGlobalDispatcher(
	new Agent({ headersTimeout: 900_000, bodyTimeout: 900_000 }),
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "llama3.2:3b";
const BATCH_SIZE = 10; // small batch = faster per-call, less likely to time out on fanless hardware
const CONCURRENCY_DELAY_MS = 0; // no rate limit, only bottlenecked by your machine

const CATEGORIES = [
	"PARKIR",
	"TOILET",
	"AKSES",
	"KEBERSIHAN",
	"HARGA",
	"PELAYANAN",
	"LAINNYA",
] as const;

type TagResult = {
	categories: {
		category: (typeof CATEGORIES)[number];
		isNegative: boolean;
		confidence: number;
	}[];
};

function buildPrompt(texts: string[]) {
	const list = texts
		.map((t, i) => `${i + 1}. "${t.replace(/"/g, "'").slice(0, 500)}"`)
		.join("\n");
	return `Kamu adalah classifier ulasan wisata Danau Toba. Untuk tiap ulasan bernomor di bawah, identifikasi kategori keluhan/topik yang disebutkan (boleh lebih dari satu, boleh kosong jika tidak relevan).

Kategori valid: PARKIR, TOILET, AKSES (jalan/akses masuk), KEBERSIHAN (sampah/kotor), HARGA, PELAYANAN, LAINNYA.

Untuk tiap kategori yang terdeteksi, tentukan apakah itu keluhan negatif (isNegative: true) atau pujian/netral (isNegative: false), dan confidence 0-1.

Ulasan:
${list}

PENTING: Balas dengan JSON array yang panjangnya PERSIS ${texts.length} elemen, urut sesuai nomor ulasan di atas (elemen pertama = ulasan 1, dst). JANGAN sertakan field nomor/index apapun. Balas HANYA array JSON, tanpa teks lain, format:
[{"categories": [{"category": "PARKIR", "isNegative": true, "confidence": 0.9}]}, {"categories": []}]`;
}

async function callOllama(prompt: string): Promise<TagResult[]> {
	const res = await fetch(OLLAMA_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: OLLAMA_MODEL,
			messages: [{ role: "user", content: prompt }],
			format: "json",
			stream: false,
			options: { temperature: 0.1 },
		}),
	});

	if (!res.ok) {
		throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
	}

	const data = await res.json();
	const raw = data.message?.content ?? "[]";
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		console.error("Failed to parse LLM output:", raw.slice(0, 300));
		return [];
	}

	if (Array.isArray(parsed)) return parsed as TagResult[];

	// small models sometimes wrap the array in an object, e.g. {"results": [...]}
	if (parsed && typeof parsed === "object") {
		const values = Object.values(parsed as Record<string, unknown>);
		const arr = values.find((v) => Array.isArray(v));
		if (Array.isArray(arr)) return arr as TagResult[];
	}

	console.error("Unexpected LLM output shape:", raw.slice(0, 300));
	return [];
}

async function tagReviews() {
	const reviews = await prisma.review.findMany({
		where: {
			reviewText: { not: null },
			placeId: { not: null }, // skip unmatched reviews, they can't be aggregated to any place
			issueTags: { none: {} }, // skip reviews already tagged (resume-safe)
		},
		select: { id: true, reviewText: true },
	});

	console.log(`Found ${reviews.length} untagged reviews with text to process.`);

	let processed = 0;
	let firstBatchLogged = false;
	for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
		const batch = reviews.slice(i, i + BATCH_SIZE);
		const prompt = buildPrompt(batch.map((r) => r.reviewText!));

		let results: TagResult[] = [];
		try {
			results = await callOllama(prompt);
		} catch (err) {
			console.error(`Batch ${i}-${i + BATCH_SIZE} failed:`, err);
			continue;
		}

		if (!firstBatchLogged) {
			console.log(
				"Sample parsed result for first batch:",
				JSON.stringify(results.slice(0, 2)),
			);
			firstBatchLogged = true;
		}

		if (results.length !== batch.length) {
			console.warn(
				`Batch ${i}-${i + BATCH_SIZE}: expected ${batch.length} results, got ${results.length}. Zipping up to the shorter length — some reviews in this batch may be skipped.`,
			);
		}

		const rows: {
			reviewId: string;
			category: IssueCategory;
			isNegative: boolean;
			confidence: number;
		}[] = [];

		const len = Math.min(results.length, batch.length);
		for (let j = 0; j < len; j++) {
			const review = batch[j];
			const categories = results[j]?.categories ?? [];
			for (const c of categories) {
				if (!CATEGORIES.includes(c.category)) continue;
				rows.push({
					reviewId: review.id,
					category: c.category as IssueCategory,
					isNegative: c.isNegative,
					confidence: c.confidence,
				});
			}
		}

		if (rows.length > 0) {
			try {
				await prisma.reviewIssueTag.createMany({
					data: rows,
					skipDuplicates: true,
				});
			} catch (err) {
				console.error(`Batch ${i}-${i + BATCH_SIZE}: DB insert failed:`, err);
			}
		}

		processed += batch.length;
		console.log(
			`Tagged ${processed}/${reviews.length} reviews (batch produced ${rows.length} tags)`,
		);
		await new Promise((r) => setTimeout(r, CONCURRENCY_DELAY_MS));
	}
}

async function aggregateSummaries() {
	console.log("Aggregating place_issue_summaries...");

	const grouped = await prisma.reviewIssueTag.groupBy({
		by: ["category"],
		_count: { _all: true },
	});

	// Need per-place aggregation -> raw query is simplest here.
	const rows: {
		placeId: string;
		category: IssueCategory;
		negativeCount: bigint;
		totalMentions: bigint;
	}[] = await prisma.$queryRawUnsafe(`
      SELECT r."placeId" as "placeId", t.category as category,
             SUM(CASE WHEN t."isNegative" THEN 1 ELSE 0 END) as "negativeCount",
             COUNT(*) as "totalMentions"
      FROM review_issue_tags t
      JOIN reviews r ON r.id = t."reviewId"
      WHERE r."placeId" IS NOT NULL
      GROUP BY r."placeId", t.category
    `);

	for (const row of rows) {
		const negativeCount = Number(row.negativeCount);
		const totalMentions = Number(row.totalMentions);
		const gapScore = totalMentions > 0 ? negativeCount / totalMentions : 0;

		await prisma.placeIssueSummary.upsert({
			where: {
				placeId_category: { placeId: row.placeId, category: row.category },
			},
			update: {
				negativeCount,
				totalMentions,
				gapScore,
				lastComputedAt: new Date(),
			},
			create: {
				placeId: row.placeId,
				category: row.category,
				negativeCount,
				totalMentions,
				gapScore,
			},
		});
	}

	console.log(`Aggregated ${rows.length} place/category summaries.`);
}

async function main() {
	const aggregateOnly = process.argv.includes("--aggregate-only");
	if (!aggregateOnly) {
		await tagReviews();
	} else {
		console.log(
			"Skipping tagReviews() — aggregating from existing review_issue_tags only.",
		);
	}
	await aggregateSummaries();
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	prisma.$disconnect();
	process.exit(1);
});
