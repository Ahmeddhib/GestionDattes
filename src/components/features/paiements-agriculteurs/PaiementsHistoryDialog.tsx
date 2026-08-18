"use client";

import { useState } from "react";
import { Eye, HandCoins } from "lucide-react";
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
import { getPaiementsByBonAchatAction } from "@/actions/paiements-agriculteurs/get-paiements-by-bon-achat.action";

type Paiement = {
    id: string;
    montant: number;
    datePaiement: Date;
    modePaiement: string | null;
    observations: string | null;
    User: { id: string; name: string };
};

interface PaiementsHistoryDialogProps {
    bonAchatId: string;
    numero: string;
}

export function PaiementsHistoryDialog({ bonAchatId, numero }: PaiementsHistoryDialogProps) {
    const { t } = useClientTranslations();
    const [paiements, setPaiements] = useState<Paiement[]>([]);
    const [loading, setLoading] = useState(false);

    async function handleOpenChange(open: boolean) {
        if (open) {
            setLoading(true);
            const result = await getPaiementsByBonAchatAction(bonAchatId);
            if (result.success) setPaiements(result.data || []);
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
                    {t("finance.paiements.historique")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-150 bg-card max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <HandCoins className="h-5 w-5 text-[#C17A2B]" />
                        {numero}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("finance.paiements.historique")}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <p className="text-sm text-muted-foreground py-4">{t("common.loading")}</p>
                ) : paiements.length === 0 ? (
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
                            {paiements.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(p.datePaiement), "dd MMM yyyy HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {p.montant.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{p.modePaiement || "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{p.User.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}
