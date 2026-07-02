import { auditRepository } from "@/repositories/audit.repository";
import { requirePermission } from "@/lib/permissions";
import type { AuditAction } from "@/generated/prisma";

/**
 * Service d'audit (MULTI-TENANT)
 * Tous les logs sont filtrés par tenantId
 */
export const auditService = {
    async log(data: {
        tenantId: string;
        actorId: string;
        action: AuditAction;
        description?: string;
        targetId?: string;
        details?: any
    }) {
        return auditRepository.create(data);
    },

    async getAuditLogs(
        tenantId: string,
        options?: { page?: number; pageSize?: number; actorId?: string; action?: AuditAction }
    ) {
        await requirePermission("audit:read");
        const result = await auditRepository.findAll(tenantId, options);

        // Transformer les données pour le format attendu par le composant
        const transformedData = result.data.map((log: any) => ({
            id: log.id,
            action: log.action,
            description: log.description,
            createdAt: log.createdAt,
            // Transformer User → actor
            actor: log.User ? {
                id: log.User.id,
                name: log.User.name,
                email: log.User.email,
            } : {
                id: 'unknown',
                name: 'Utilisateur supprimé',
                email: 'unknown@example.com'
            },
        }));

        return {
            data: transformedData,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
        };
    },

    async getAuditLogsCount(tenantId: string) {
        await requirePermission("audit:read");
        return auditRepository.count(tenantId);
    },
};
