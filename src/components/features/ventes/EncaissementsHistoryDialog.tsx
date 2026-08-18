"use client";

import { useState } from "react";
import { Eye, Wallet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { getEncaissementsByVenteAction } from "@/actions/encaissements-clients/get-encaissements-by-vente.action";

type Encaissement = {
    id: string;
    montant: number;
    dateEncaissement: Date;
    modePaiement: string | null;
    User: { id: string; name: string };
};

interface EncaissementsHistoryDialogProps {
    venteId: string;
    clientNom: string;
}

export function EncaissementsHistoryDialog({ venteId, clientNom }: EncaissementsHistoryDialogProps) {
    const { t } = useClientTranslations();
    const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
    const [loading, setLoading] = useState(false);

    async function handleOpenChange(open: boolean) {
        if (open) {
            setLoading(true);
            const result = await getEncaissementsByVenteAction(venteId);
            if (result.success) setEncaissements(result.data || []);
            setLoading(false);
        }
    }

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-sm text-foreground hover:bg-muted"
                >
                    <Eye className="h-3.5 w-3.5 text-[#C17A2B]" />
                    {t("finance.ventes.historiqueEncaissements")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-150 bg-card max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-[#C17A2B]" />
                        {clientNom}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("finance.ventes.historiqueEncaissements")}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <p className="text-sm text-muted-foreground py-4">{t("common.loading")}</p>
                ) : encaissements.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">{t("common.noResults")}</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("pesees.datePesee")}</TableHead>
                                <TableHead className="text-right">{t("finance.paiements.montant")}</TableHead>
                                <TableHead>{t("finance.paiements.modePaiement")}</TableHead>
                                <TableHead>{t("common.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {encaissements.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(e.dateEncaissement), "dd MMM yyyy HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {e.montant.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{e.modePaiement || "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{e.User.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}
