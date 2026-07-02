import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        // Await params (Next.js 15+)
        const { userId } = await params;

        // Vérifier que l'utilisateur demande ses propres tenants
        if (session.user.id !== userId) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const tenants = await getUserTenants(userId);

        return NextResponse.json({ tenants });
    } catch (error) {
        console.error("Error fetching user tenants:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des Wakalas" },
            { status: 500 }
        );
    }
}
