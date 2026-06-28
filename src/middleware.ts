import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

export function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Vérifier si l'utilisateur a un token de session NextAuth
    const sessionToken = req.cookies.get("authjs.session-token") || req.cookies.get("__Secure-authjs.session-token");
    const isLoggedIn = !!sessionToken;

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
