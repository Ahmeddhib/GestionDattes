import { auditRepository } from "@/repositories/audit.repository";
import { requirePermission } from "@/lib/permissions";
import type { AuditAction } from "@/generated/prisma";

export const auditService = {
    async log(data: { actorId: string; action: AuditAction; description?: string; targetId?: string; details?: any }) {
        return auditRepository.create(data);
    },

    async getAuditLogs(options?: { page?: number; pageSize?: number; actorId?: string; action?: AuditAction }) {
        await requirePermission("audit:read");
        return auditRepository.findAll(options);
    },

    async getAuditLogsCount() {
        await requirePermission("audit:read");
        return auditRepository.count();
    },
};
