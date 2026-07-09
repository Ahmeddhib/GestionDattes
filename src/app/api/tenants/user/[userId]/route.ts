import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";

/**
 * API route pour récupérer les tenants (wakalas) d'un utilisateur
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        // Vérifier que l'utilisateur est authentifié
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Await params (Next.js 15+)
        const { userId } = await params;

        // Vérifier que l'utilisateur demande ses propres tenants
        if (session.user.id !== userId) {
            return NextResponse.json(
                { error: "Accès refusé" },
                { status: 403 }
            );
        }

        // Récupérer les tenants de l'utilisateur
        const tenants = await getUserTenants(userId);

        return NextResponse.json({
            success: true,
            tenants,
        });
    } catch (error) {
        console.error("Error fetching user tenants:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des wakalas" },
            { status: 500 }
        );
    }
}
