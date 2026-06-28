"use server";

import { createRoleValidator } from "@/validators/role.validator";
import { roleService } from "@/services/role.service";
import { revalidatePath } from "next/cache";

export async function createRoleAction(formData: unknown) {
    console.log("📝 createRoleAction - Données reçues:", formData);

    const parsed = createRoleValidator.safeParse(formData);

    if (!parsed.success) {
        console.log("❌ Validation Zod échouée:", parsed.error.flatten().fieldErrors);
        return { error: parsed.error.flatten().fieldErrors };
    }

    console.log("✅ Validation Zod réussie, appel du service...");

    try {
        const data = await roleService.createRole(parsed.data);
        console.log("✅ Rôle créé avec succès:", data.id);
        revalidatePath("/dashboard/roles");
        revalidatePath("/dashboard");
        return { data };
    } catch (e) {
        console.log("❌ Erreur dans le service:", e);
        return { error: e instanceof Error ? e.message : "Erreur lors de la création du rôle" };
    }
}
