"use client";

import { Eye, Receipt } from "lucide-react";
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

type Ligne = {
    id: string;
    prixKg: number;
    quantiteAcceptee: number;
    poidsNetTotal: number;
    typeDate: { id: string; nom: string } | null;
    typeCaisse: { id: string; nom: string } | null;
};

interface LignesDetailDialogProps {
    numero: string;
    lignes: Ligne[];
}

export function LignesDetailDialog({ numero, lignes }: LignesDetailDialogProps) {
    const { t } = useClientTranslations();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-sm border-border text-foreground hover:bg-muted"
                >
                    <Eye className="h-3.5 w-3.5 text-[#C17A2B]" />
                    {t("bonAchat.voirDetail")} ({lignes.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-150 bg-card max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-[#C17A2B]" />
                        {numero}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("bonAchat.detailLignes")}
                    </DialogDescription>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("livraisons.typeDate")}</TableHead>
                            <TableHead>{t("livraisons.typeCaisse")}</TableHead>
                            <TableHead className="text-right">{t("nouvellePesee.quantiteAcceptee")}</TableHead>
                            <TableHead className="text-right">{t("bonAchat.prixKg")}</TableHead>
                            <TableHead className="text-right">{t("bonAchat.montant")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lignes.map((ligne) => (
                            <TableRow key={ligne.id}>
                                <TableCell className="font-medium text-foreground">
                                    {ligne.typeDate?.nom}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{ligne.typeCaisse?.nom}</TableCell>
                                <TableCell className="text-right">
                                    {ligne.quantiteAcceptee.toFixed(2)} kg
                                </TableCell>
                                <TableCell className="text-right">{ligne.prixKg.toFixed(3)}</TableCell>
                                <TableCell className="text-right font-semibold text-[#C17A2B]">
                                    {(ligne.quantiteAcceptee * ligne.prixKg).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
