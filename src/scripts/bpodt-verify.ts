// // scripts/bpodt-verify.ts
// // One-off: match Place (category=WISATA) against official BPODT operational
// // data, flag SINKRON / TIDAK_SINKRON, write a short human-readable note.
// // Run with: npx tsx scripts/bpodt-verify.ts /path/to/Dataset_HackathonTourism_-_IT_DEL.xlsx

// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@prisma/client";
// import { Pool } from "pg";
// import * as XLSX from "xlsx";

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// const filePath = process.argv[2];
// if (!filePath) {
// 	console.error("Usage: npx tsx scripts/bpodt-verify.ts <path-to-xlsx>");
// 	process.exit(1);
// }

// function normName(s: string): string {
// 	return s
// 		.toLowerCase()
// 		.replace(/[^a-z0-9 ]/g, " ")
// 		.replace(/\s+/g, " ")
// 		.trim();
// }

// function levenshtein(a: string, b: string): number {
// 	const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
// 		new Array(b.length + 1).fill(0),
// 	);
// 	for (let i = 0; i <= a.length; i++) dp[i][0] = i;
// 	for (let j = 0; j <= b.length; j++) dp[0][j] = j;
// 	for (let i = 1; i <= a.length; i++) {
// 		for (let j = 1; j <= b.length; j++) {
// 			dp[i][j] =
// 				a[i - 1] === b[j - 1]
// 					? dp[i - 1][j - 1]
// 					: 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
// 		}
// 	}
// 	return dp[a.length][b.length];
// }

// function similarity(a: string, b: string): number {
// 	const maxLen = Math.max(a.length, b.length);
// 	if (maxLen === 0) return 1;
// 	return 1 - levenshtein(a, b) / maxLen;
// }

// function extractHours(text: string): string[] {
// 	const matches = text.match(/\d{1,2}[.:]\d{2}\s*-\s*\d{1,2}[.:]\d{2}/g) ?? [];
// 	return matches.map((m) => m.replace(/\./g, ":").replace(/\s+/g, ""));
// }

// function is24Jam(text: string): boolean {
// 	return /24\s*jam/i.test(text);
// }

// interface BpodtRow {
// 	kabupaten: string;
// 	destinasi: string;
// 	fasilitasUmum: string;
// 	fasilitasPenunjang: string;
// 	waktuOperasional: string;
// }

// function loadBpodtRows(path: string): BpodtRow[] {
// 	const wb = XLSX.readFile(path);
// 	const sheet = wb.Sheets["waktu operasional destinasi"];
// 	const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// 	const rows: BpodtRow[] = [];
// 	let lastKabupaten = "";

// 	for (const r of raw) {
// 		const kabupaten = String(r["KABUPATEN"] ?? "").trim();
// 		if (kabupaten) lastKabupaten = kabupaten;

// 		const destinasi = String(r["OBJEK / DESTINASI WISATA"] ?? "").trim();
// 		if (!destinasi) continue;

// 		rows.push({
// 			kabupaten: lastKabupaten,
// 			destinasi,
// 			fasilitasUmum: String(r["FASILITAS UMUM"] ?? "").trim(),
// 			fasilitasPenunjang: String(r["FASILITAS PENUNJANG"] ?? "").trim(),
// 			waktuOperasional: String(r["WAKTU OPERASIONAL"] ?? "").trim(),
// 		});
// 	}
// 	return rows;
// }

// async function main() {
// 	const bpodtRows = loadBpodtRows(filePath);
// 	console.log(`Loaded ${bpodtRows.length} BPODT rows.`);

// 	const places = await prisma.place.findMany({
// 		where: { category: "WISATA" },
// 		select: {
// 			id: true,
// 			name: true,
// 			operationalHour: true,
// 			facilitiesOrActivities: true,
// 		},
// 	});

// 	let matched = 0;
// 	let sinkron = 0;
// 	let tidakSinkron = 0;

// 	for (const bp of bpodtRows) {
// 		const bpNorm = normName(bp.destinasi);

// 		let best: (typeof places)[number] | null = null;
// 		let bestScore = 0;

// 		for (const p of places) {
// 			const score = similarity(bpNorm, normName(p.name));
// 			if (score > bestScore) {
// 				bestScore = score;
// 				best = p;
// 			}
// 		}

// 		if (!best || bestScore < 0.76) continue;
// 		matched++;

// 		const issues: string[] = [];

// 		const scrapedHours = extractHours(best.operationalHour ?? "");
// 		const bpodtHours = extractHours(bp.waktuOperasional);
// 		const scraped24 = is24Jam(best.operationalHour ?? "");
// 		const bpodt24 = is24Jam(bp.waktuOperasional);

// 		let hoursMismatch = false;
// 		if (scraped24 !== bpodt24) {
// 			hoursMismatch = true;
// 			issues.push(
// 				`Jam operasional beda: data kami="${best.operationalHour ?? "-"}", BPODT="${bp.waktuOperasional}"`,
// 			);
// 		} else if (
// 			scrapedHours.length > 0 &&
// 			bpodtHours.length > 0 &&
// 			!scrapedHours.some((h) => bpodtHours.includes(h))
// 		) {
// 			hoursMismatch = true;
// 			issues.push(
// 				`Jam operasional beda: data kami="${best.operationalHour ?? "-"}", BPODT="${bp.waktuOperasional}"`,
// 			);
// 		}

// 		const notes: string[] = [];
// 		const bpFacilities =
// 			`${bp.fasilitasUmum} ${bp.fasilitasPenunjang}`.toLowerCase();
// 		const ourFacilities = (best.facilitiesOrActivities ?? "").toLowerCase();
// 		const facilityKeywords = [
// 			"toilet",
// 			"parkir",
// 			"mushala",
// 			"gazebo",
// 			"homestay",
// 			"warung",
// 			"restoran",
// 		];
// 		const missingInOurs = facilityKeywords.filter(
// 			(k) => bpFacilities.includes(k) && !ourFacilities.includes(k),
// 		);
// 		if (missingInOurs.length > 0) {
// 			notes.push(
// 				`Info tambahan dari BPODT (belum tercatat di data kami): ${missingInOurs.join(", ")}`,
// 			);
// 		}

// 		const verified = hoursMismatch ? "TIDAK_SINKRON" : "SINKRON";
// 		if (verified === "SINKRON") sinkron++;
// 		else tidakSinkron++;

// 		const noteText =
// 			issues.length > 0
// 				? [...issues, ...notes].join(" | ")
// 				: notes.length > 0
// 					? `Jam operasional cocok. ${notes.join(" | ")}`
// 					: `Cocok dengan data BPODT (kabupaten: ${bp.kabupaten})`;

// 		await prisma.place.update({
// 			where: { id: best.id },
// 			data: {
// 				bpodtVerified: verified,
// 				bpodtNote: noteText,
// 			},
// 		});
// 	}

// 	console.log(`Matched ${matched}/${bpodtRows.length} BPODT rows to a Place.`);
// 	console.log(`SINKRON: ${sinkron}, TIDAK_SINKRON: ${tidakSinkron}`);

// 	await prisma.$disconnect();
// }

// main().catch((err) => {
// 	console.error(err);
// 	prisma.$disconnect();
// 	process.exit(1);
// });
