import { NextResponse } from "next/server";

/**
 * La configuration initiale doit passer par les migrations/seed, jamais par
 * une route web publique capable de lire et modifier les données.
 */
export async function GET() {
    return NextResponse.json(
        { error: "Cette route de configuration est désactivée." },
        { status: 410 }
    );
}

export async function POST() {
    return GET();
}
