"use server";

import { auditService } from "@/services/audit.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import type { AuditAction } from "@/generated/prisma";

export async function getAuditLogsAction(options?: {
    page?: number;
    pageSize?: number;
    actorId?: string;
    action?: AuditAction;
}) {
    try {
        const tenantId = await getTenantId();
        const result = await auditService.getAuditLogs(tenantId, options);
        return { data: result };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des logs d'audit"
        };
    }
}
