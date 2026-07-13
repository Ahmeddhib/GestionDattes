"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Guard pour vérifier qu'un tenant est sélectionné
 * Redirige vers /select-wakala si aucun tenant n'est sélectionné
 */
export function TenantGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Attendre que la session soit chargée
        if (status === "loading") return;

        // Si pas de session, laisser le proxy gérer la redirection vers /login
        if (status === "unauthenticated") return;

        // Si authentifié mais pas de tenant ET pas déjà sur /select-wakala
        if (session && !session.user.tenantId && pathname !== "/select-wakala") {
            console.log("🔒 Aucun tenant sélectionné, redirection vers /select-wakala");
            router.push("/select-wakala");
        }
    }, [session, status, pathname, router]);

    // Afficher un loader pendant la vérification
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF0DC]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C17A2B] mx-auto"></div>
                    <p className="mt-4 text-[#3D1C00]">Chargement...</p>
                </div>
            </div>
        );
    }

    // Si pas de tenant, ne pas afficher le contenu (redirection en cours)
    if (session && !session.user.tenantId && pathname !== "/select-wakala") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF0DC]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C17A2B] mx-auto"></div>
                    <p className="mt-4 text-[#3D1C00]">Redirection...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
