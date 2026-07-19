import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const LIST_CACHE_PREFIX = "tobasentinel:budget-proposals:list:";
const LIST_CACHE_TTL = 30;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const search = searchParams.get("search") ?? "";
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(searchParams.get("pageSize")) || 10),
	);

	const cacheKey = `${LIST_CACHE_PREFIX}${JSON.stringify({ search, page, pageSize })}`;
	const cached = await redis.get(cacheKey);
	if (cached) {
		return NextResponse.json(cached);
	}

	const where = search
		? {
				place: {
					name: { contains: search, mode: "insensitive" as const },
				},
			}
		: undefined;

	const [proposals, totalItems] = await Promise.all([
		db.budgetProposal.findMany({
			where,
			orderBy: { urgencyScore: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
			include: {
				place: { select: { id: true, name: true, placeCode: true, address: true } },
				approvedBy: { select: { id: true, name: true } },
			},
		}),
		db.budgetProposal.count({ where }),
	]);

	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	const response = {
		items: proposals,
		pagination: { page, pageSize, totalItems, totalPages },
	};

	await redis.set(cacheKey, response, { ex: LIST_CACHE_TTL });

	return NextResponse.json(response);
}
