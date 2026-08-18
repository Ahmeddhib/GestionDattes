import { getServerTranslations } from "@/i18n/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ActionBadge } from "@/components/features/audit/ActionBadge";

export interface LigneAuditSaison {
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    auteur: string;
}

/**
 * Historique d'audit d'une saison : uniquement les entrées dont `targetId`
 * est la saison elle-même (ouverture, génération de bilan, clôture). Les
 * écritures métier de la campagne ne sont pas listées ici — elles ciblent
 * leur propre document et se consultent depuis le journal global.
 */
export async function SaisonAuditTable({ logs }: { logs: LigneAuditSaison[] }) {
    const t = await getServerTranslations();

    if (logs.length === 0) {
        return <p className="p-10 text-center text-sm text-muted-foreground">{t("common.noResults")}</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("finance.saisons.detail.audit.date")}</TableHead>
                    <TableHead>{t("finance.saisons.detail.audit.action")}</TableHead>
                    <TableHead>{t("finance.saisons.detail.audit.auteur")}</TableHead>
                    <TableHead>{t("finance.saisons.detail.audit.description")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{log.createdAt}</TableCell>
                        <TableCell>
                            <ActionBadge action={log.action} />
                        </TableCell>
                        <TableCell>{log.auteur}</TableCell>
                        <TableCell className="text-muted-foreground">{log.description ?? "—"}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
