"use server";

import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";
import { selectWakalaAction } from "./select-wakala.action";

/**
 * Action pour vérifier et gérer la sélection de tenant après login
 * Retourne la route vers laquelle rediriger
 */
export async function checkTenantSelectionAction() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { redirect: "/login" };
        }

        // Si le tenant est déjà sélectionné, aller au dashboard
        if (
            session.user.tenantId &&
            session.user.role !== "PENDING_TENANT_SELECTION"
        ) {
            return { redirect: "/dashboard" };
        }

        // Récupérer les tenants de l'utilisateur
        const tenants = await getUserTenants(session.user.id);

        if (tenants.length === 0) {
            return {
                redirect: "/login",
                error: "Aucune Wakala assignée à votre compte",
            };
        }

        // Si un seul tenant, sélection automatique
        if (tenants.length === 1) {
            const result = await selectWakalaAction(tenants[0].id);

            if (result.error) {
                return {
                    redirect: "/login",
                    error: result.error,
                };
            }

            return { redirect: "/dashboard" };
        }

        // Si plusieurs tenants, rediriger vers la page de sélection
        return { redirect: "/select-wakala" };
    } catch (error) {
        console.error("Error in checkTenantSelectionAction:", error);
        return {
            redirect: "/login",
            error: "Erreur lors de la vérification du tenant",
        };
    }
}
