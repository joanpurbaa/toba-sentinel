import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJWT(token: string) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // 1. Kalo gak ada token, tendang ke login
    if (!token) {
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/driver")) {
            return NextResponse.redirect(new URL("/masuk", request.url));
        }
        return NextResponse.next();
    }

    const decoded = decodeJWT(token);
    const role = decoded?.role?.toUpperCase();

    // 2. KUNCI PROTEKSI ROUTE
    // Jika DRIVER nekat masuk ke area /dashboard, paksa balik ke /driver
    if (role === "DRIVER" && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/driver", request.url));
    }

    // Jika ADMIN/STAFF nyasar ke area /driver, balikkan ke /dashboard
    if ((role === "ADMIN" || role === "STAFF") && pathname.startsWith("/driver")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

// Tentukan halaman mana saja yang mau diawasi oleh middleware ini
export const config = {
    matcher: ["/dashboard/:path*", "/driver/:path*"],
};