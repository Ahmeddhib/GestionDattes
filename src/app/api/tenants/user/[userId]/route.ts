import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";
import { estErreurConnexionBase } from "@/lib/db-error";

/** API sécurisée pour récupérer les wakalas accessibles par l'utilisateur. */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { userId } = await params;

        if (session.user.id !== userId) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const tenants = await getUserTenants(userId);
        return NextResponse.json({ success: true, tenants });
    } catch (error) {
        const databaseUnavailable = estErreurConnexionBase(error);

        // L'ErrorEvent WebSocket brut déclenchait l'overlay Next en dev sous
        // la forme inutile `{clientVersion}`. Un avertissement concis suffit.
        console.warn(
            databaseUnavailable
                ? "Tenant list temporarily unavailable (database timeout)"
                : "Tenant list could not be loaded"
        );

        return NextResponse.json(
            {
                success: false,
                tenants: [],
                error: databaseUnavailable ? "DATABASE_UNAVAILABLE" : "TENANTS_UNAVAILABLE",
                retryable: true,
            },
            { status: 503 }
        );
    }
}
