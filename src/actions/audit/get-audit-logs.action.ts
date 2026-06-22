"use server";

import { getAuditLogs } from "@/services/audit.service";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

export async function getAuditLogsAction() {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageUsers(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const logs = await getAuditLogs(200);
        return { logs };
    } catch (error: any) {
        return { error: error.message };
    }
}
