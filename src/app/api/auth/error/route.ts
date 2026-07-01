import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");

    // Rediriger vers la page de login avec l'erreur
    const loginUrl = new URL("/login", request.url);
    if (error) {
        loginUrl.searchParams.set("error", error);
    }

    return NextResponse.redirect(loginUrl);
}
