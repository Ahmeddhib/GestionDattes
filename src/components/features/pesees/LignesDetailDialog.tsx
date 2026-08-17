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
                    className="gap-2 rounded-[7px] border-[#C17A2B]/30 text-[#3D1C00] hover:bg-[#FAF0DC]"
                >
                    <Eye className="h-3.5 w-3.5 text-[#C17A2B]" />
                    {t("bonAchat.voirDetail")} ({lignes.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[600px] bg-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {numeroLot}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
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
                                <TableCell className="font-medium text-[#3D1C00]">
                                    {ligne.typeDate?.nom}
                                </TableCell>
                                <TableCell className="text-gray-600">{ligne.typeCaisse?.nom}</TableCell>
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
