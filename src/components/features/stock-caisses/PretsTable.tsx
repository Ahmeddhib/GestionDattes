"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { createPretsColumns } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileSpreadsheet, Search, X } from "lucide-react";
import { exportPretsToPDF, exportPretsToExcel } from "@/lib/export-utils";

type PretsTableProps = {
    prets?: any[];
};

export function PretsTable({ prets = [] }: PretsTableProps) {
    const { t } = useClientTranslations();
    const columns = createPretsColumns(t);

    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAgriculteur, setSelectedAgriculteur] = useState<string>("all");
    const [selectedTypeCaisse, setSelectedTypeCaisse] = useState<string>("all");
    const [selectedStatut, setSelectedStatut] = useState<string>("EN_COURS");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");

    // Extraire les agriculteurs et types de caisses uniques
    const agriculteurs = useMemo(() => {
        const unique = new Map();
        prets.forEach((p) => {
            if (!unique.has(p.agriculteur.id)) {
                unique.set(p.agriculteur.id, p.agriculteur);
            }
        });
        return Array.from(unique.values());
    }, [prets]);

    const typesCaisses = useMemo(() => {
        const unique = new Map();
        prets.forEach((p) => {
            if (!unique.has(p.typeCaisse.id)) {
                unique.set(p.typeCaisse.id, p.typeCaisse);
            }
        });
        return Array.from(unique.values());
    }, [prets]);

    // Appliquer les filtres
    const filteredPrets = useMemo(() => {
        return prets.filter((pret) => {
            // Filtre par statut
            if (selectedStatut !== "all" && pret.statut !== selectedStatut) {
                return false;
            }

            // Filtre par recherche (nom, prénom, code)
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const fullName = `${pret.agriculteur.nom} ${pret.agriculteur.prenom}`.toLowerCase();
                const code = pret.agriculteur.code.toLowerCase();
                if (!fullName.includes(search) && !code.includes(search)) {
                    return false;
                }
            }

            // Filtre par agriculteur
            if (selectedAgriculteur !== "all" && pret.agriculteur.id !== selectedAgriculteur) {
                return false;
            }

            // Filtre par type de caisse
            if (selectedTypeCaisse !== "all" && pret.typeCaisse.id !== selectedTypeCaisse) {
                return false;
            }

            // Filtre par période
            const pretDate = new Date(pret.datePreT);
            if (dateDebut) {
                const debut = new Date(dateDebut);
                if (pretDate < debut) return false;
            }
            if (dateFin) {
                const fin = new Date(dateFin);
                fin.setHours(23, 59, 59);
                if (pretDate > fin) return false;
            }

            return true;
        });
    }, [prets, selectedStatut, searchTerm, selectedAgriculteur, selectedTypeCaisse, dateDebut, dateFin]);

    // Réinitialiser les filtres
    const resetFilters = () => {
        setSearchTerm("");
        setSelectedAgriculteur("all");
        setSelectedTypeCaisse("all");
        setSelectedStatut("EN_COURS");
        setDateDebut("");
        setDateFin("");
    };

    const hasActiveFilters =
        searchTerm ||
        selectedAgriculteur !== "all" ||
        selectedTypeCaisse !== "all" ||
        selectedStatut !== "EN_COURS" ||
        dateDebut ||
        dateFin;

    return (
        <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#C17A2B]/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold text-[#3D1C00]">
                    {t("pretsCaisses.pretsCaisses")} ({filteredPrets.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportPretsToPDF(filteredPrets)}
                        className="rounded-[9px] border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        {t("common.exportPDF")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportPretsToExcel(filteredPrets)}
                        className="rounded-[9px] border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        {t("common.exportExcel")}
                    </Button>
                </div>
            </div>

            {/* Filtres */}
            <div className="mb-4 space-y-3 p-4 rounded-[9px] bg-[#FAF0DC]/50 border border-[#C17A2B]/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3D1C00]/40" />
                        <Input
                            placeholder={t("common.search")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 rounded-[7px] border-[#C17A2B]/40 bg-white"
                        />
                    </div>

                    {/* Filtre Agriculteur */}
                    <Select value={selectedAgriculteur} onValueChange={setSelectedAgriculteur}>
                        <SelectTrigger className="rounded-[7px] border-[#C17A2B]/40 bg-white">
                            <SelectValue placeholder={t("pretsCaisses.filterAgriculteur")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">{t("common.all")}</SelectItem>
                            {agriculteurs.map((agri: any) => (
                                <SelectItem key={agri.id} value={agri.id}>
                                    {agri.nom} {agri.prenom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Filtre Type de Caisse */}
                    <Select value={selectedTypeCaisse} onValueChange={setSelectedTypeCaisse}>
                        <SelectTrigger className="rounded-[7px] border-[#C17A2B]/40 bg-white">
                            <SelectValue placeholder={t("pretsCaisses.filterTypeCaisse")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">{t("common.all")}</SelectItem>
                            {typesCaisses.map((type: any) => (
                                <SelectItem key={type.id} value={type.id}>
                                    {type.nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Filtre Statut */}
                    <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                        <SelectTrigger className="rounded-[7px] border-[#C17A2B]/40 bg-white">
                            <SelectValue placeholder={t("pretsCaisses.filterStatut")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">{t("common.all")}</SelectItem>
                            <SelectItem value="EN_COURS">{t("pretsCaisses.enCours")}</SelectItem>
                            <SelectItem value="RETOURNE">{t("pretsCaisses.retourne")}</SelectItem>
                            <SelectItem value="INCOMPLET">{t("pretsCaisses.incomplet")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Période */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="text-xs text-[#3D1C00]/60 mb-1 block">
                            {t("common.dateDebut")}
                        </label>
                        <Input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            className="rounded-[7px] border-[#C17A2B]/40 bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[#3D1C00]/60 mb-1 block">
                            {t("common.dateFin")}
                        </label>
                        <Input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            className="rounded-[7px] border-[#C17A2B]/40 bg-white"
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="rounded-[9px] border-[#C17A2B]/40 hover:bg-white"
                        >
                            <X className="h-4 w-4 mr-2" />
                            {t("common.resetFilters")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tableau */}
            {filteredPrets.length > 0 ? (
                <DataTable columns={columns} data={filteredPrets} />
            ) : (
                <div className="text-center py-8 text-[#3D1C00]/60">
                    {hasActiveFilters
                        ? t("common.noResults")
                        : t("pretsCaisses.aucunPret")}
                </div>
            )}
        </div>
    );
}
