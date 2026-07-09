"use server";

import { signOut } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Action pour se déconnecter et nettoyer tous les cookies de wakala
 */
export async function logoutAction() {
    try {
        // Nettoyer les cookies de wakala
        const cookieStore = await cookies();
        cookieStore.delete("selected-tenant-id");

        // Déconnexion NextAuth
        await signOut({ redirectTo: "/login" });
    } catch (error) {
        console.error("Error in logoutAction:", error);
        throw error;
    }
}
