"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Warehouse } from "lucide-react";
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
import type { Lot } from "./columns";

interface LotsDetailDialogProps {
    typeDate: string;
    lots: Lot[];
}

export function LotsDetailDialog({ typeDate, lots }: LotsDetailDialogProps) {
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
                    {t("stockDattes.voirLots")} ({lots.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[600px] bg-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-[#C17A2B]" />
                        {typeDate}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("stockDattes.detailLots")}
                    </DialogDescription>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("livraisons.numeroLot")}</TableHead>
                            <TableHead>{t("livraisons.agriculteur")}</TableHead>
                            <TableHead>{t("stockDattes.dateEntree")}</TableHead>
                            <TableHead className="text-right">{t("stockDattes.quantiteTotale")}</TableHead>
                            <TableHead className="text-right">{t("stockDattes.quantiteDisponible")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lots.map((lot) => (
                            <TableRow key={lot.id}>
                                <TableCell className="font-medium text-[#3D1C00]">{lot.numeroLot}</TableCell>
                                <TableCell className="text-gray-600">{lot.agriculteur}</TableCell>
                                <TableCell className="text-gray-600">
                                    {format(new Date(lot.dateEntree), "dd MMM yyyy", { locale: fr })}
                                </TableCell>
                                <TableCell className="text-right">{lot.quantite.toFixed(2)} kg</TableCell>
                                <TableCell className="text-right font-semibold text-[#C17A2B]">
                                    {lot.quantiteDisponible.toFixed(2)} kg
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
