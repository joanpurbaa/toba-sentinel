import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const role = searchParams.get("role");

	const users = await db.user.findMany({
		where: role ? { role: role as any } : undefined,
		select: { id: true, name: true, role: true },
		orderBy: { name: "asc" },
	});

	return NextResponse.json(users);
}
