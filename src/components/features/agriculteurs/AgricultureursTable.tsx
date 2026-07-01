"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Users, Search, MapPin, Phone } from "lucide-react";
import { UpdateAgriculteurDialog } from "./UpdateAgriculteurDialog";
import { DeleteAgriculteurDialog } from "./DeleteAgriculteurDialog";

type Agriculteur = {
    id: string;
    code: string;
    cin: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    adresse: string | null;
    nbPalmiers: number;
    superficie: number | null;
    productionEstimee: number | null;
    regionId: string;
    region: {
        id: string;
        nom: string;
        code: string | null;
    };
    _count?: {
        livraisons: number;
        pretCaisses: number;
    };
    createdAt: Date;
    updatedAt: Date;
};

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface AgricultureursTableProps {
    initialData: Agriculteur[];
    regions: Region[];
}

export function AgricultureursTable({ initialData, regions }: AgricultureursTableProps) {
    const router = useRouter();
    const [agriculteurs, setAgriculteurs] = useState<Agriculteur[]>(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAgriculteur, setSelectedAgriculteur] = useState<Agriculteur | null>(null);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Sync avec initialData quand il change (après refresh)
    useEffect(() => {
        setAgriculteurs(initialData);
    }, [initialData]);

    // Filtrer les agriculteurs
    const filteredAgriculteurs = agriculteurs.filter(
        (a) =>
            a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.cin.includes(searchTerm) ||
            a.region.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdate = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setIsUpdateOpen(true);
    };

    const handleDelete = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setIsDeleteOpen(true);
    };

    if (agriculteurs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-[#C17A2B]/10 p-6 mb-4">
                    <Users className="h-12 w-12 text-[#C17A2B]" />
                </div>
                <h3 className="text-lg font-semibold text-[#3D1C00] mb-2">
                    Aucun agriculteur
                </h3>
                <p className="text-sm text-[#3D1C00]/60 max-w-sm">
                    Commencez par enregistrer votre premier agriculteur
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3D1C00]/40" />
                        <Input
                            placeholder="Rechercher par nom, prénom, code, CIN ou région..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                        />
                    </div>
                    <div className="text-sm text-[#3D1C00]/60">
                        {filteredAgriculteurs.length} résultat(s)
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#F0E0C0] hover:bg-[#FAF0DC]/50">
                                <TableHead className="text-[#3D1C00] font-semibold">Code</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold">Agriculteur</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold">CIN</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold">Région</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold">Contact</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold text-center">Palmiers</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold text-center">Superficie</TableHead>
                                <TableHead className="text-[#3D1C00] font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgriculteurs.map((agriculteur) => (
                                <TableRow
                                    key={agriculteur.id}
                                    className="border-[#F0E0C0] hover:bg-[#FAF0DC]/30"
                                >
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-[7px] bg-[#C17A2B]/10 px-2.5 py-0.5 text-xs font-medium text-[#C17A2B]">
                                            {agriculteur.code}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-[#3D1C00]">
                                            {agriculteur.nom} {agriculteur.prenom}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-[#3D1C00]/60">
                                        {agriculteur.cin}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-[#C17A2B]" />
                                            <span className="text-sm text-[#3D1C00]">
                                                {agriculteur.region.nom}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {agriculteur.telephone ? (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="h-3.5 w-3.5 text-[#3D1C00]/40" />
                                                <span className="text-sm text-[#3D1C00]/60">
                                                    {agriculteur.telephone}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#3D1C00]/40">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-[#C17A2B]/10 w-10 h-10 text-sm font-medium text-[#C17A2B]">
                                            {agriculteur.nbPalmiers}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-[#3D1C00]/60">
                                        {agriculteur.superficie
                                            ? `${agriculteur.superficie} ha`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUpdate(agriculteur)}
                                                className="h-8 w-8 p-0 hover:bg-[#C17A2B]/10 hover:text-[#C17A2B]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(agriculteur)}
                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {filteredAgriculteurs.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-[#3D1C00]/60">
                        Aucun résultat pour "{searchTerm}"
                    </div>
                )}
            </div>

            {selectedAgriculteur && (
                <>
                    <UpdateAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        regions={regions}
                        open={isUpdateOpen}
                        onOpenChange={setIsUpdateOpen}
                    />
                    <DeleteAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            )}
        </>
    );
}
