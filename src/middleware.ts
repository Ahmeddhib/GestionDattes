import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";

export default auth((req) => {
    const pathname = req.nextUrl.pathname;
    const isLoggedIn = !!req.auth;

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, req.url));
    }

    const role = req.auth?.user?.role;

    // Check admin access for users routes
    if (pathname.startsWith(ROUTES.USERS) && role !== "ADMIN") {
        return NextResponse.redirect(new URL(ROUTES.UNAUTHORIZED, req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/users/:path*"],
};
