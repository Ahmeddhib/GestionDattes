"use server";

import { signIn } from "@/lib/auth";

/**
 * Démarre OAuth côté serveur. Cette voie ne dépend pas de la découverte des
 * providers par next-auth/react et redirige directement vers Google.
 */
export async function googleSignInAction() {
    await signIn("google", { redirectTo: "/select-wakala" });
}
