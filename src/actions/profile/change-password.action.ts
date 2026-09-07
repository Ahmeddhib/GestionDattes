"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les nouveaux mots de passe ne correspondent pas",
});

export async function changePasswordAction(input: unknown) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non authentifié" };
    if (session.user.authProvider === "google") {
        return { error: "Le mot de passe d'un compte Google se gère depuis Google" };
    }

    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide" };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true, active: true },
    });
    if (!user?.active) return { error: "Compte introuvable ou inactif" };

    const currentIsValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!currentIsValid) return { error: "Le mot de passe actuel est incorrect" };

    const reusesCurrentPassword = await bcrypt.compare(parsed.data.newPassword, user.password);
    if (reusesCurrentPassword) return { error: "Choisissez un mot de passe différent de l'ancien" };

    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
    });

    return { success: true };
}
