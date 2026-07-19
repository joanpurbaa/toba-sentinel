import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => null);
		const email = typeof body?.email === "string" ? body.email.trim() : "";
		const password = typeof body?.password === "string" ? body.password : "";

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email dan password wajib diisi." },
				{ status: 400 },
			);
		}

		const user = await db.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (!user || !user.isActive) {
			return NextResponse.json(
				{ error: "Email atau password salah." },
				{ status: 401 },
			);
		}

		const isValidPassword = await verifyPassword(password, user.passwordHash);
		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "Email atau password salah." },
				{ status: 401 },
			);
		}

		const token = await signToken({
			sub: user.id,
			email: user.email,
			role: user.role,
		});

		const response = NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				name: user.name,
			},
		});

		response.cookies.set({
			name: "auth_token",
			value: token,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat login." },
			{ status: 500 },
		);
	}
}
