"use server";

import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getAuditLogs, getAuditLogsByUser } from "@/services/audit.service";

export async function getAuditLogsAction(userId?: string) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageUsers(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const logs = userId
            ? await getAuditLogsByUser(userId)
            : await getAuditLogs();

        return { logs };
    } catch (error: any) {
        return { error: error.message };
    }
}
