"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "llama3.2:3b";
const BATCH_SIZE = 40;
const CONCURRENCY_DELAY_MS = 0;
const CATEGORIES = [
    "PARKIR",
    "TOILET",
    "AKSES",
    "KEBERSIHAN",
    "HARGA",
    "PELAYANAN",
    "LAINNYA",
];
function buildPrompt(texts) {
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
function normalizeOllamaResponse(parsed, expectedLength) {
    if (Array.isArray(parsed)) {
        if (parsed.length > 0 && "categories" in (parsed[0] || {})) {
            return parsed;
        }
        const normalized = [];
        for (let i = 0; i < parsed.length && i < expectedLength; i++) {
            const item = parsed[i];
            if (item && typeof item === "object") {
                if ("categories" in item && Array.isArray(item.categories)) {
                    normalized.push(item);
                }
                else {
                    const keys = Object.keys(item).filter((k) => !isNaN(Number(k)));
                    if (keys.length > 0) {
                        const categories = [];
                        for (const key of keys) {
                            const value = item[key];
                            if (value && typeof value === "object") {
                                const category = value.category || value.Category || value.name || value.label;
                                const isNegative = value.isNegative !== undefined
                                    ? value.isNegative
                                    : value.is_negative !== undefined
                                        ? value.is_negative
                                        : value.negative !== undefined
                                            ? value.negative
                                            : false;
                                const confidence = value.confidence || value.Confidence || value.score || 0.8;
                                if (category && CATEGORIES.includes(category)) {
                                    categories.push({
                                        category: category,
                                        isNegative: Boolean(isNegative),
                                        confidence: Number(confidence),
                                    });
                                }
                            }
                        }
                        if (categories.length > 0) {
                            normalized.push({ categories });
                        }
                        else {
                            normalized.push({ categories: [] });
                        }
                    }
                    else {
                        normalized.push({ categories: [] });
                    }
                }
            }
            else {
                normalized.push({ categories: [] });
            }
        }
        return normalized;
    }
    if (parsed && typeof parsed === "object") {
        const obj = parsed;
        const possibleArrayFields = [
            "results",
            "data",
            "response",
            "items",
            "categories",
            "tags",
            "classifications",
        ];
        for (const field of possibleArrayFields) {
            if (Array.isArray(obj[field])) {
                return normalizeOllamaResponse(obj[field], expectedLength);
            }
        }
        const keys = Object.keys(obj).filter((k) => !isNaN(Number(k)) && Number(k) > 0);
        if (keys.length > 0) {
            const normalized = [];
            keys.sort((a, b) => Number(a) - Number(b));
            for (const key of keys) {
                const value = obj[key];
                if (value && typeof value === "object") {
                    if ("categories" in value && Array.isArray(value.categories)) {
                        normalized.push(value);
                    }
                    else {
                        const category = value.category ||
                            value.Category ||
                            value.name;
                        const isNegative = value.isNegative !== undefined
                            ? value.isNegative
                            : value.is_negative !== undefined
                                ? value.is_negative
                                : false;
                        const confidence = value.confidence || value.Confidence || 0.8;
                        if (category && CATEGORIES.includes(category)) {
                            normalized.push({
                                categories: [
                                    {
                                        category: category,
                                        isNegative: Boolean(isNegative),
                                        confidence: Number(confidence),
                                    },
                                ],
                            });
                        }
                        else {
                            normalized.push({ categories: [] });
                        }
                    }
                }
                else {
                    normalized.push({ categories: [] });
                }
            }
            while (normalized.length < expectedLength) {
                normalized.push({ categories: [] });
            }
            return normalized.slice(0, expectedLength);
        }
    }
    console.warn("Could not parse Ollama response, returning empty results");
    return Array.from({ length: expectedLength }, () => ({ categories: [] }));
}
async function callOllama(prompt, expectedLength, retry = 2) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 600000);
        const res = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                stream: false,
                format: "json",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                options: {
                    temperature: 0.1,
                },
            }),
        });
        clearTimeout(timeout);
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = await res.json();
        let raw = (data.message?.content ?? "").trim();
        raw = raw
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/, "")
            .replace(/\s*```$/, "")
            .replace(/^[\s\n]*\[/, "[")
            .replace(/\]\s*$/, "]")
            .trim();
        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        }
        catch (e) {
            try {
                let fixed = raw
                    .replace(/,\s*}/g, "}")
                    .replace(/,\s*]/g, "]")
                    .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":')
                    .replace(/'/g, '"');
                const arrayMatch = fixed.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    fixed = arrayMatch[0];
                }
                parsed = JSON.parse(fixed);
            }
            catch (e2) {
                try {
                    const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                    }
                }
                catch (e3) {
                    console.error(`All parsing strategies failed. Raw response:`, raw);
                    return Array.from({ length: expectedLength }, () => ({ categories: [] }));
                }
            }
        }
        let normalized = normalizeOllamaResponse(parsed, expectedLength);
        if (normalized.length > expectedLength) {
            normalized = normalized.slice(0, expectedLength);
        }
        while (normalized.length < expectedLength) {
            normalized.push({ categories: [] });
        }
        return normalized;
    }
    catch (err) {
        if (retry > 0) {
            console.log(`Retrying Ollama... (${retry} attempts left)`);
            await new Promise((r) => setTimeout(r, 3000));
            return callOllama(prompt, expectedLength, retry - 1);
        }
        console.error("Ollama call failed after retries:", err);
        return Array.from({ length: expectedLength }, () => ({ categories: [] }));
    }
}
async function tagReviews() {
    const reviews = await prisma.review.findMany({
        where: {
            reviewText: { not: null },
            placeId: { not: null },
            issueTags: { none: {} },
        },
        select: { id: true, reviewText: true },
    });
    console.log(`Found ${reviews.length} untagged reviews with text to process.`);
    let processed = 0;
    let firstBatchLogged = false;
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
        const batch = reviews.slice(i, i + BATCH_SIZE);
        const prompt = buildPrompt(batch.map((r) => r.reviewText));
        let results = [];
        try {
            results = await callOllama(prompt, batch.length);
        }
        catch (err) {
            console.error(`Batch ${i}-${i + BATCH_SIZE} failed:`, err);
            continue;
        }
        if (!firstBatchLogged) {
            console.log("Sample parsed result for first batch:", JSON.stringify(results.slice(0, 2), null, 2));
            firstBatchLogged = true;
        }
        if (results.length !== batch.length) {
            console.warn(`Batch ${i}-${i + BATCH_SIZE}: expected ${batch.length} results, got ${results.length}. Zipping up to the shorter length — some reviews in this batch may be skipped.`);
        }
        const rows = [];
        const len = Math.min(results.length, batch.length);
        for (let j = 0; j < len; j++) {
            const review = batch[j];
            const result = results[j];
            if (!result || !Array.isArray(result.categories)) {
                continue;
            }
            for (const c of result.categories) {
                if (!CATEGORIES.includes(c.category))
                    continue;
                rows.push({
                    reviewId: review.id,
                    category: c.category,
                    isNegative: c.isNegative,
                    confidence: Math.min(Math.max(c.confidence, 0), 1),
                });
            }
        }
        if (rows.length > 0) {
            try {
                const inserted = await prisma.reviewIssueTag.createMany({
                    data: rows,
                    skipDuplicates: true,
                });
                console.log(`✅ Inserted ${inserted.count} tags into Neon`);
            }
            catch (err) {
                console.error(`Batch ${i}-${i + BATCH_SIZE}: DB insert failed:`, err);
            }
        }
        else {
            console.log(`⚠️ Batch ${i}-${i + BATCH_SIZE}: No valid tags generated`);
        }
        processed += batch.length;
        console.log(`📊 Processed ${processed}/${reviews.length} reviews | Generated ${rows.length} tags`);
        await new Promise((r) => setTimeout(r, CONCURRENCY_DELAY_MS));
    }
}
async function aggregateSummaries() {
    console.log("Aggregating place_issue_summaries...");
    const tagCount = await prisma.reviewIssueTag.count();
    if (tagCount === 0) {
        console.log("No tags found, skipping aggregation.");
        return;
    }
    const grouped = await prisma.reviewIssueTag.groupBy({
        by: ["category"],
        _count: { _all: true },
    });
    console.log(`Found ${grouped.length} categories with tags.`);
    const rows = await prisma.$queryRawUnsafe(`
      SELECT r."placeId" as "placeId", t.category as category,
             SUM(CASE WHEN t."isNegative" THEN 1 ELSE 0 END) as "negativeCount",
             COUNT(*) as "totalMentions"
      FROM review_issue_tags t
      JOIN reviews r ON r.id = t."reviewId"
      WHERE r."placeId" IS NOT NULL
      GROUP BY r."placeId", t.category
    `);
    if (rows.length === 0) {
        console.log("No place summaries to aggregate.");
        return;
    }
    let upserted = 0;
    for (const row of rows) {
        const negativeCount = Number(row.negativeCount);
        const totalMentions = Number(row.totalMentions);
        const gapScore = totalMentions > 0 ? negativeCount / totalMentions : 0;
        try {
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
            upserted++;
        }
        catch (err) {
            console.error(`Failed to upsert summary for place ${row.placeId}, category ${row.category}:`, err);
        }
    }
    console.log(`✅ Aggregated ${upserted}/${rows.length} place/category summaries.`);
}
async function main() {
    console.log("🚀 Starting AI tagging process...");
    console.log(`📌 Model: ${OLLAMA_MODEL}`);
    console.log(`📌 Batch size: ${BATCH_SIZE}`);
    await tagReviews();
    console.log("🏁 Tagging complete. Starting aggregation...");
    await aggregateSummaries();
    console.log("🎉 Process completed successfully!");
    await prisma.$disconnect();
}
main().catch((err) => {
    console.error("❌ Fatal error:", err);
    prisma.$disconnect();
    process.exit(1);
});
