import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const protectedPaths = [
	"/dashboard",
	"/distribusi",
	"/stok-barang",
	"/riwayat",
	"/petugas",
];
const publicPaths = ["/masuk", "/"];

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	if (
		publicPaths.some(
			(path) => pathname === path || pathname.startsWith(`${path}/`),
		)
	) {
		const token = request.cookies.get("auth_token")?.value;
		if (token) {
			try {
				await verifyToken(token);
				if (pathname === "/" || pathname === "/masuk") {
					return NextResponse.redirect(new URL("/dashboard", request.url));
				}
				return NextResponse.next();
			} catch {
				return NextResponse.next();
			}
		}
		return NextResponse.next();
	}

	const isProtected = protectedPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	if (!isProtected) {
		return NextResponse.next();
	}

	const token = request.cookies.get("auth_token")?.value;
	if (!token) {
		const loginUrl = new URL("/masuk", request.url);
		return NextResponse.redirect(loginUrl);
	}

	try {
		await verifyToken(token);
		return NextResponse.next();
	} catch {
		const loginUrl = new URL("/masuk", request.url);
		return NextResponse.redirect(loginUrl);
	}
}
