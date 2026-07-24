// scripts/generate-road-access.ts
// Precompute driving routes from Parapat (main gateway to Lake Toba area) to
// each WISATA place using OSRM's public routing server. Route geometry is
// real (from OpenStreetMap road network); the AKSES gapScore overlay reflects
// aggregated visitor complaints for that destination, not a per-segment
// road-condition sensor.
// Run with: npx tsx scripts/generate-road-access.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Parapat: main gateway town to Lake Toba tourism area
const REFERENCE_LAT = 2.6717;
const REFERENCE_LON = 98.9339;

const OSRM_BASE = "http://router.project-osrm.org/route/v1/driving";
const DELAY_MS = 1200; // be polite to the public demo server

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function fetchRoute(destLat: number, destLon: number) {
	const url = `${OSRM_BASE}/${REFERENCE_LON},${REFERENCE_LAT};${destLon},${destLat}?overview=full&geometries=geojson`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`OSRM ${res.status}`);
	const data = await res.json();
	if (data.code !== "Ok" || !data.routes?.[0]) {
		return null; // e.g. islands unreachable by road (Samosir interior, etc.)
	}
	return {
		geometry: data.routes[0].geometry, // GeoJSON LineString
		distanceKm: data.routes[0].distance / 1000,
	};
}

async function main() {
	const places = await prisma.place.findMany({
		where: {
			category: "WISATA",
			latitude: { not: null },
			longitude: { not: null },
		},
		select: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			issueSummaries: {
				where: { category: "AKSES" },
				select: { gapScore: true, negativeCount: true, totalMentions: true },
			},
		},
	});

	console.log(
		`Generating routes for ${places.length} WISATA places from Parapat...`,
	);

	let success = 0;
	let unreachable = 0;
	let failed = 0;

	for (const place of places) {
		try {
			const route = await fetchRoute(place.latitude!, place.longitude!);
			if (!route) {
				unreachable++;
				console.log(
					`${place.name}: no driving route found (likely island/ferry access)`,
				);
				await sleep(DELAY_MS);
				continue;
			}

			const akses = place.issueSummaries[0] ?? null;

			await prisma.roadAccessRoute.upsert({
				where: { placeId: place.id },
				update: {
					geometry: route.geometry,
					distanceKm: route.distanceKm,
					gapScore: akses?.gapScore ?? null,
					negativeCount: akses?.negativeCount ?? 0,
					totalMentions: akses?.totalMentions ?? 0,
				},
				create: {
					placeId: place.id,
					geometry: route.geometry,
					distanceKm: route.distanceKm,
					gapScore: akses?.gapScore ?? null,
					negativeCount: akses?.negativeCount ?? 0,
					totalMentions: akses?.totalMentions ?? 0,
				},
			});

			success++;
			console.log(
				`${place.name}: ${route.distanceKm.toFixed(1)} km, AKSES gapScore=${akses?.gapScore ?? "no data"}`,
			);
		} catch (err) {
			failed++;
			console.error(`${place.name}: failed -`, err);
		}

		await sleep(DELAY_MS);
	}

	console.log(
		`\nDone. Success: ${success}, Unreachable by road: ${unreachable}, Failed: ${failed}`,
	);
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error(err);
	prisma.$disconnect();
	process.exit(1);
});
