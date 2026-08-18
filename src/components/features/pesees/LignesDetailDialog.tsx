"use client";

import { Eye, Scale } from "lucide-react";
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
import type { LignePesee } from "./columns";

interface LignesDetailDialogProps {
    numeroLot: string;
    lignes: LignePesee[];
}

export function LignesDetailDialog({ numeroLot, lignes }: LignesDetailDialogProps) {
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
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {numeroLot}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("nouvellePesee.lignes")}
                    </DialogDescription>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("livraisons.typeDate")}</TableHead>
                            <TableHead>{t("livraisons.typeCaisse")}</TableHead>
                            <TableHead className="text-right">{t("pesees.nombreCaisses")}</TableHead>
                            <TableHead className="text-right">{t("pesees.poidsNetTotal")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lignes.map((ligne) => (
                            <TableRow key={ligne.id}>
                                <TableCell className="font-medium text-foreground">
                                    {ligne.typeDate?.nom}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{ligne.typeCaisse?.nom}</TableCell>
                                <TableCell className="text-right">{ligne.nombreCaisses}</TableCell>
                                <TableCell className="text-right font-semibold text-[#C17A2B]">
                                    {ligne.poidsNetTotal.toFixed(2)} kg
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
