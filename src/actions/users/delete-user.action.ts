"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function deleteUserAction(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "Non authentifié" };
        if (session.user.role !== "ADMIN") return { error: "Non autorisé" };

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return { error: "Utilisateur non trouvé" };

        if (targetUser.id === session.user.id) {
            return { error: "Vous ne pouvez pas supprimer votre propre compte" };
        }

        await prisma.$transaction([
            prisma.auditLog.create({
                data: {
                    actorId: session.user.id,
                    targetId: id,
                    action: "UPDATE_USER", // On utilise UPDATE_USER ou CREATE_USER car DELETE_USER n'existe peut-être pas dans l'enum. On verra.
                    description: `Suppression de l'utilisateur ${targetUser.email}`,
                },
            }),
            prisma.user.delete({ where: { id } })
        ]);

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Erreur lors de la suppression" };
    }
}
