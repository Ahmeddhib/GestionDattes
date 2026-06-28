import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/lib/routes";

/**
 * Proxy Next.js 16+
 * Remplace le middleware pour l'authentification Edge Runtime
 * Vérifie uniquement le cookie de session NextAuth sans importer Prisma
 */
export function proxy(req: NextRequest) {
    // Vérifier si l'utilisateur a un token de session NextAuth
    // authjs.session-token = développement
    // __Secure-authjs.session-token = production (HTTPS)
    const sessionToken =
        req.cookies.get("authjs.session-token") ||
        req.cookies.get("__Secure-authjs.session-token");

    const isLoggedIn = !!sessionToken;

    // Rediriger vers login si non authentifié
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
