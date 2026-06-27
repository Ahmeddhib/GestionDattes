"use server";

import { auditService } from "@/services/audit.service";
import type { AuditAction } from "@/generated/prisma";

export async function getAuditLogsAction(options?: {
    page?: number;
    pageSize?: number;
    actorId?: string;
    action?: AuditAction;
}) {
    try {
        const result = await auditService.getAuditLogs(options);
        return { data: result };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des logs d'audit"
        };
    }
}
