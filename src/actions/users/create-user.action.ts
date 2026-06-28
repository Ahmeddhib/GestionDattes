"use server";

import { userService } from "@/services/user.service";
import { createUserValidator } from "@/validators/user.validator";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: unknown) {
    console.log("📝 createUserAction - Données reçues:", formData);

    const parsed = createUserValidator.safeParse(formData);

    if (!parsed.success) {
        console.log("❌ Validation Zod échouée:", parsed.error.flatten().fieldErrors);
        return { error: parsed.error.flatten().fieldErrors };
    }

    console.log("✅ Validation Zod réussie, appel du service...");

    try {
        const data = await userService.createUser(parsed.data);
        console.log("✅ Utilisateur créé avec succès:", data.id);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { data };
    } catch (error) {
        console.log("❌ Erreur dans le service:", error);
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur"
        };
    }
}
