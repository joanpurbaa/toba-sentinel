// scripts/import-knowledge-transport.ts
// Import transportasi, Artikel Danau Toba, and Info Seputar Danau Toba sheets
// from the raw dataset into TransportRoute and KnowledgeArticle tables.
// Run with: npx tsx scripts/import-knowledge-transport.ts /path/to/Dataset_HackathonTourism_-_IT_DEL.xlsx

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
	console.error(
		"Usage: npx tsx scripts/import-knowledge-transport.ts <path-to-xlsx>",
	);
	process.exit(1);
}

function parsePrice(val: string): { min: number | null; max: number | null } {
	if (!val) return { min: null, max: null };
	const nums = val.match(/[\d.]+/g);
	if (!nums) return { min: null, max: null };
	const parsed = nums
		.map((n) => parseFloat(n.replace(/\./g, "")))
		.filter((n) => !isNaN(n));
	if (parsed.length === 0) return { min: null, max: null };
	return { min: Math.min(...parsed), max: Math.max(...parsed) };
}

async function importTransport(wb: XLSX.WorkBook) {
	const sheet = wb.Sheets["transportasi"];
	const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

	await prisma.transportRoute.deleteMany();

	let count = 0;
	for (const r of raw) {
		const transportName = String(r["transport-name"] ?? "").trim();
		const direction = String(r["direction"] ?? "").trim();
		if (!transportName || !direction) continue;

		const isFerry = /ke\s/i.test(direction) && direction.split(",").length === 1;
		const routeType = isFerry ? "FERRY" : "DARAT";

		let routeCities: string[];
		if (isFerry) {
			routeCities = direction
				.split(/\s+ke\s+/i)
				.map((c) => c.trim())
				.filter(Boolean);
		} else {
			routeCities = direction
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean);
		}

		const priceRaw = String(r["price"] ?? "").trim();
		const { min, max } = parsePrice(priceRaw);

		await prisma.transportRoute.create({
			data: {
				transportName,
				vehicleType: String(r["jenis-mobil"] ?? "").trim() || null,
				routeType,
				routeCities,
				routeDescription: direction,
				priceMin: min,
				priceMax: max,
				priceRaw: priceRaw || null,
				operationalHour: String(r["operational-hour"] ?? "").trim() || null,
				description: String(r["description"] ?? "").trim() || null,
			},
		});
		count++;
	}
	console.log(`Imported ${count} transport routes.`);
}

async function importKnowledge(wb: XLSX.WorkBook) {
	await prisma.knowledgeArticle.deleteMany();
	let count = 0;

	const artikelSheet = wb.Sheets["Artikel Danau Toba"];
	if (artikelSheet) {
		const raw: any[] = XLSX.utils.sheet_to_json(artikelSheet, { defval: "" });
		for (const r of raw) {
			const title = String(r["Judul Artikel"] ?? "").trim();
			const content = String(r["Rangkuman (Paragraf Awal)"] ?? "").trim();
			if (!title || !content) continue;

			await prisma.knowledgeArticle.create({
				data: {
					category: "ARTIKEL",
					title,
					kabupaten: String(r["Kabupaten"] ?? "").trim() || null,
					content,
					sourceUrl: String(r["Link Artikel"] ?? "").trim() || null,
				},
			});
			count++;
		}
	}

	console.log(`Imported ${count} knowledge articles.`);
}

async function main() {
	const wb = XLSX.readFile(filePath);
	await importTransport(wb);
	await importKnowledge(wb);
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	prisma.$disconnect();
	process.exit(1);
});
