// scripts/bpodt-verify.ts
// Cross-validate scraped Place data against official BPODT operational data.
// Two dimensions: (1) operational hours, (2) claimed facilities vs AI-tagged
// negative complaint rate for the matching IssueCategory.
// Run with: npx tsx scripts/bpodt-verify.ts /path/to/Dataset_HackathonTourism_-_IT_DEL.xlsx

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import * as XLSX from "xlsx";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const filePath = process.argv[2];
if (!filePath) {
	console.error("Usage: npx tsx scripts/bpodt-verify.ts <path-to-xlsx>");
	process.exit(1);
}

const MISMATCH_GAP_THRESHOLD = 0.5;
const MISMATCH_MIN_MENTIONS = 2;

const FACILITY_TO_CATEGORY: Record<string, string> = {
	toilet: "TOILET",
	parkir: "PARKIR",
};

function normName(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function levenshtein(a: string, b: string): number {
	const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
		new Array(b.length + 1).fill(0),
	);
	for (let i = 0; i <= a.length; i++) dp[i][0] = i;
	for (let j = 0; j <= b.length; j++) dp[0][j] = j;
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			dp[i][j] =
				a[i - 1] === b[j - 1]
					? dp[i - 1][j - 1]
					: 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
		}
	}
	return dp[a.length][b.length];
}

function similarity(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

function extractHours(text: string): string[] {
	const matches = text.match(/\d{1,2}[.:]\d{2}\s*-\s*\d{1,2}[.:]\d{2}/g) ?? [];
	return matches.map((m) => m.replace(/\./g, ":").replace(/\s+/g, ""));
}

function is24Jam(text: string): boolean {
	return /24\s*jam/i.test(text);
}

interface BpodtRow {
	kabupaten: string;
	destinasi: string;
	fasilitasUmum: string;
	fasilitasPenunjang: string;
	waktuOperasional: string;
}

function loadBpodtRows(path: string): BpodtRow[] {
	const wb = XLSX.readFile(path);
	const sheet = wb.Sheets["waktu operasional destinasi"];
	const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

	const rows: BpodtRow[] = [];
	let lastKabupaten = "";

	for (const r of raw) {
		const kabupaten = String(r["KABUPATEN"] ?? "").trim();
		if (kabupaten) lastKabupaten = kabupaten;

		const destinasi = String(r["OBJEK / DESTINASI WISATA"] ?? "").trim();
		if (!destinasi) continue;

		rows.push({
			kabupaten: lastKabupaten,
			destinasi,
			fasilitasUmum: String(r["FASILITAS UMUM"] ?? "").trim(),
			fasilitasPenunjang: String(r["FASILITAS PENUNJANG"] ?? "").trim(),
			waktuOperasional: String(r["WAKTU OPERASIONAL"] ?? "").trim(),
		});
	}
	return rows;
}

async function main() {
	const bpodtRows = loadBpodtRows(filePath);
	console.log(`Loaded ${bpodtRows.length} BPODT rows.`);

	const places = await prisma.place.findMany({
		where: { category: "WISATA" },
		select: {
			id: true,
			name: true,
			operationalHour: true,
			issueSummaries: {
				where: { totalMentions: { gt: 0 } },
				select: {
					category: true,
					gapScore: true,
					negativeCount: true,
					totalMentions: true,
				},
			},
		},
	});

	let matched = 0;
	let sinkron = 0;
	let tidakSinkron = 0;

	for (const bp of bpodtRows) {
		const bpNorm = normName(bp.destinasi);

		let best: (typeof places)[number] | null = null;
		let bestScore = 0;

		for (const p of places) {
			const score = similarity(bpNorm, normName(p.name));
			if (score > bestScore) {
				bestScore = score;
				best = p;
			}
		}

		if (!best || bestScore < 0.76) continue;
		matched++;

		const notesForText: string[] = [];

		const scrapedHours = extractHours(best.operationalHour ?? "");
		const bpodtHours = extractHours(bp.waktuOperasional);
		const scraped24 = is24Jam(best.operationalHour ?? "");
		const bpodt24 = is24Jam(bp.waktuOperasional);

		let hoursMismatch = false;
		if (scraped24 !== bpodt24) {
			hoursMismatch = true;
		} else if (
			scrapedHours.length > 0 &&
			bpodtHours.length > 0 &&
			!scrapedHours.some((h) => bpodtHours.includes(h))
		) {
			hoursMismatch = true;
		}
		if (hoursMismatch) {
			notesForText.push(
				`Jam operasional beda: data kami="${best.operationalHour ?? "-"}", BPODT="${bp.waktuOperasional}"`,
			);
		}

		const bpFacilitiesRaw = `${bp.fasilitasUmum} ${bp.fasilitasPenunjang}`.trim();
		const bpFacilitiesLower = bpFacilitiesRaw.toLowerCase();

		const facilityChecks: any[] = [];
		let facilityMismatch = false;

		for (const [keyword, category] of Object.entries(FACILITY_TO_CATEGORY)) {
			if (!bpFacilitiesLower.includes(keyword)) continue;

			const summary = best.issueSummaries.find((s) => s.category === category);
			const gapScore = summary?.gapScore ?? 0;
			const totalMentions = summary?.totalMentions ?? 0;
			const negativeCount = summary?.negativeCount ?? 0;

			const mismatch =
				totalMentions >= MISMATCH_MIN_MENTIONS &&
				gapScore >= MISMATCH_GAP_THRESHOLD;
			if (mismatch) {
				facilityMismatch = true;
				notesForText.push(
					`BPODT klaim fasilitas ${keyword} tersedia, namun ${negativeCount}/${totalMentions} ulasan (${Math.round(gapScore * 100)}%) mengeluhkan ${keyword} secara negatif`,
				);
			}

			facilityChecks.push({
				keyword,
				category,
				claimedByBpodt: true,
				gapScore,
				negativeCount,
				totalMentions,
				mismatch,
			});
		}

		const unverifiableKeywords = [
			"mushala",
			"gazebo",
			"homestay",
			"warung",
			"restoran",
		].filter((k) => bpFacilitiesLower.includes(k));

		const verified =
			hoursMismatch || facilityMismatch ? "TIDAK_SINKRON" : "SINKRON";
		if (verified === "SINKRON") sinkron++;
		else tidakSinkron++;

		const auditDetail = {
			kabupaten: bp.kabupaten,
			hoursCheck: {
				oursHours: best.operationalHour ?? "-",
				bpodtHours: bp.waktuOperasional,
				mismatch: hoursMismatch,
			},
			facilityChecks,
			unverifiableFacilities: unverifiableKeywords,
			bpodtFacilitiesRaw: bpFacilitiesRaw,
		};

		const noteText =
			notesForText.length > 0
				? notesForText.join(" | ")
				: `Cocok dengan data BPODT (kabupaten: ${bp.kabupaten})`;

		await prisma.place.update({
			where: { id: best.id },
			data: {
				bpodtVerified: verified,
				bpodtNote: noteText,
				bpodtAuditDetail: auditDetail,
			},
		});
	}

	console.log(`Matched ${matched}/${bpodtRows.length} BPODT rows to a Place.`);
	console.log(`SINKRON: ${sinkron}, TIDAK_SINKRON: ${tidakSinkron}`);

	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	prisma.$disconnect();
	process.exit(1);
});
