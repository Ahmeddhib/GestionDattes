"use client";

import { useState, useMemo } from "react";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createAgricultureursColumns, type Agriculteur } from "./columns";
import { UpdateAgriculteurDialog } from "./UpdateAgriculteurDialog";
import { DeleteAgriculteurDialog } from "./DeleteAgriculteurDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface AgricultureursTableAdvancedProps {
    initialData: Agriculteur[];
    regions: Region[];
}

export function AgricultureursTableAdvanced({
    initialData,
    regions,
}: AgricultureursTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedAgriculteur, setSelectedAgriculteur] = useState<Agriculteur | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Filtrer les agriculteurs par région ET par recherche (code, nom, prenom)
    const filteredData = useMemo(() => {
        let filtered = initialData;

        // Filtre par région
        if (selectedRegion !== "all") {
            filtered = filtered.filter((agri) => agri.regionId === selectedRegion);
        }

        // Filtre par recherche intelligente (code, nom complet, prenom, cin)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();

            // Diviser la recherche en mots individuels
            const searchWords = query.split(/\s+/).filter(word => word.length > 0);

            filtered = filtered.filter((agri) => {
                const code = agri.code?.toLowerCase() || "";
                const nom = agri.nom?.toLowerCase() || "";
                const prenom = agri.prenom?.toLowerCase() || "";
                const nomComplet = `${nom} ${prenom}`.trim();
                const prenomNom = `${prenom} ${nom}`.trim(); // Ordre inversé
                const cin = agri.cin?.toLowerCase() || "";

                // Recherche simple: si un seul mot, chercher dans tous les champs
                if (searchWords.length === 1) {
                    const word = searchWords[0];
                    return (
                        code.includes(word) ||
                        nom.includes(word) ||
                        prenom.includes(word) ||
                        cin.includes(word)
                    );
                }

                // Recherche multi-mots: tous les mots doivent être trouvés
                // dans le nom complet (n'importe quel ordre)
                const allWordsFound = searchWords.every(word =>
                    nomComplet.includes(word) || prenomNom.includes(word)
                );

                // OU recherche dans code/cin
                const inCodeOrCin = code.includes(query) || cin.includes(query);

                return allWordsFound || inCodeOrCin;
            });
        }

        return filtered;
    }, [initialData, selectedRegion, searchQuery]);

    const handleUpdate = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setDeleteDialogOpen(true);
    };

    const columns = createAgricultureursColumns(handleUpdate, handleDelete, t);

    return (
        <>
            {/* Filtre par région */}
            <div className="mb-4 flex items-center gap-4">
                <label className="text-sm font-medium text-[#3D1C00]">
                    {t("agriculteurs.region")} :
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[250px] rounded-[7px] border-[#C17A2B]/20 bg-white">
                        <SelectValue placeholder={t("common.all")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                                {region.nom} {region.code ? `(${region.code})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedRegion !== "all" && (
                    <span className="text-sm text-[#3D1C00]/60">
                        {filteredData.length} {t("agriculteurs.title").toLowerCase()}
                    </span>
                )}
            </div>

            <DataTableAdvanced
                columns={columns}
                data={filteredData}
                searchPlaceholder={`${t("common.search")} (code, nom, prénom, CIN)`}
                enableRowSelection={true}
                enableDragDrop={false}
                onSearchChange={setSearchQuery}
            />

            {selectedAgriculteur && (
                <>
                    <UpdateAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        regions={regions}
                        open={updateDialogOpen}
                        onOpenChange={setUpdateDialogOpen}
                    />
                    <DeleteAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
