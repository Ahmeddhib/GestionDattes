import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getServerTranslations } from "@/i18n/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface EncaissementLigne {
    id: string;
    montant: number;
    dateEncaissement: Date | string;
    modePaiement: string | null;
    observations: string | null;
    User: { id: string; name: string | null } | null;
    Vente: { id: string; Client: { id: string; nom: string } | null } | null;
}

/**
 * Table des encaissements clients. Server Component : cette vue est en
 * consultation seule (les encaissements se saisissent depuis la vente
 * concernée), elle n'a donc besoin d'aucun JavaScript côté client.
 */
export async function EncaissementsTable({
    encaissements,
}: {
    encaissements: EncaissementLigne[];
}) {
    const t = await getServerTranslations();

    if (encaissements.length === 0) {
        return (
            <p className="p-10 text-center text-sm text-muted-foreground">
                {t("common.noResults")}
            </p>
        );
    }

    const total = encaissements.reduce((somme, e) => somme + e.montant, 0);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("finance.encaissements.date")}</TableHead>
                    <TableHead>{t("finance.encaissements.client")}</TableHead>
                    <TableHead>{t("finance.encaissements.modePaiement")}</TableHead>
                    <TableHead>{t("finance.encaissements.enregistrePar")}</TableHead>
                    <TableHead className="text-right">{t("finance.encaissements.montant")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {encaissements.map((e) => (
                    <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">
                            {format(new Date(e.dateEncaissement), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{e.Vente?.Client?.nom ?? "—"}</TableCell>
                        <TableCell>{e.modePaiement ?? "—"}</TableCell>
                        <TableCell>{e.User?.name ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium text-foreground">
                            {e.montant.toFixed(2)} TND
                        </TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-[#FAF0DC]/60 font-semibold">
                    <TableCell colSpan={4}>{t("common.total")}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-foreground">
                        {total.toFixed(2)} TND
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}
