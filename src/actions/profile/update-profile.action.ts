"use server";

import { auth, unstable_update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(80),
});

export async function updateProfileAction(input: unknown) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non authentifié" };

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Nom invalide" };
    }

    try {
        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { name: parsed.data.name },
            select: { name: true },
        });

        await unstable_update({ user: { name: user.name } });
        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard", "layout");
        return { success: true, name: user.name };
    } catch (error) {
        console.error("[PROFILE] Mise à jour impossible:", error);
        return { error: "Impossible de mettre le profil à jour pour le moment" };
    }
}
