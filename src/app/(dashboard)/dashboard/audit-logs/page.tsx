import { auditService } from "@/services/audit.service";
import { AuditLogsTable } from "@/components/features/audit/AuditLogsTable";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { getTenantId } from "@/lib/tenant/get-tenant";

export const metadata = {
    title: "Journal d'audit — Gestion des Dattes",
};

async function AuditLogsData() {
    const tenantId = await getTenantId();
    const { data, total } = await auditService.getAuditLogs(tenantId, { pageSize: 20 });
    return <AuditLogsTable initialData={data} initialTotal={total} />;
}

export default async function AuditLogsPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<TableSkeleton rows={10} />}>
                <AuditLogsData />
            </Suspense>
        </div>
    );
}
