import { getAuditLogsAction } from "@/actions/audit/get-audit-logs.action";
import AuditLogsClient from "./audit-logs-client";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
    const res = await getAuditLogsAction();

    if (res.error) {
        if (res.error === "Non authentifié") redirect("/login");
        return <div className="p-8 text-red-500">{res.error}</div>;
    }

    return <AuditLogsClient initialLogs={res.logs ?? []} />;
}
