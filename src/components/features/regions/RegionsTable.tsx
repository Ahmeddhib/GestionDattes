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
import { Pencil, Trash2, Users, MapPin } from "lucide-react";
import { UpdateRegionDialog } from "./UpdateRegionDialog";
import { DeleteRegionDialog } from "./DeleteRegionDialog";

type Region = {
    id: string;
    nom: string;
    code: string | null;
    _count?: {
        agriculteurs: number;
        users: number;
    };
    createdAt: Date;
    updatedAt: Date;
};

interface RegionsTableProps {
    initialData: Region[];
}

export function RegionsTable({ initialData }: RegionsTableProps) {
    const router = useRouter();
    const [regions, setRegions] = useState<Region[]>(initialData);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Sync avec initialData quand il change (après refresh)
    useEffect(() => {
        setRegions(initialData);
    }, [initialData]);

    const handleUpdate = (region: Region) => {
        setSelectedRegion(region);
        setIsUpdateOpen(true);
    };

    const handleDelete = (region: Region) => {
        setSelectedRegion(region);
        setIsDeleteOpen(true);
    };

    if (regions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-[#C17A2B]/10 p-6 mb-4">
                    <MapPin className="h-12 w-12 text-[#C17A2B]" />
                </div>
                <h3 className="text-lg font-semibold text-[#3D1C00] mb-2">
                    Aucune région
                </h3>
                <p className="text-sm text-[#3D1C00]/60 max-w-sm">
                    Commencez par créer votre première région de production
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#F0E0C0] hover:bg-[#FAF0DC]/50">
                            <TableHead className="text-[#3D1C00] font-semibold">Nom</TableHead>
                            <TableHead className="text-[#3D1C00] font-semibold">Code</TableHead>
                            <TableHead className="text-[#3D1C00] font-semibold text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Users className="h-4 w-4" />
                                    Agriculteurs
                                </div>
                            </TableHead>
                            <TableHead className="text-[#3D1C00] font-semibold text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Users className="h-4 w-4" />
                                    Utilisateurs
                                </div>
                            </TableHead>
                            <TableHead className="text-[#3D1C00] font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {regions.map((region) => (
                            <TableRow
                                key={region.id}
                                className="border-[#F0E0C0] hover:bg-[#FAF0DC]/30"
                            >
                                <TableCell className="font-medium text-[#3D1C00]">
                                    {region.nom}
                                </TableCell>
                                <TableCell>
                                    {region.code ? (
                                        <span className="inline-flex items-center rounded-[7px] bg-[#C17A2B]/10 px-2.5 py-0.5 text-xs font-medium text-[#C17A2B]">
                                            {region.code}
                                        </span>
                                    ) : (
                                        <span className="text-[#3D1C00]/40 text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center rounded-full bg-[#C17A2B]/10 w-8 h-8 text-sm font-medium text-[#C17A2B]">
                                        {region._count?.agriculteurs || 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 w-8 h-8 text-sm font-medium text-blue-700">
                                        {region._count?.users || 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUpdate(region)}
                                            className="h-8 w-8 p-0 hover:bg-[#C17A2B]/10 hover:text-[#C17A2B]"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(region)}
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

            {selectedRegion && (
                <>
                    <UpdateRegionDialog
                        region={selectedRegion}
                        open={isUpdateOpen}
                        onOpenChange={setIsUpdateOpen}
                    />
                    <DeleteRegionDialog
                        region={selectedRegion}
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                    />
                </>
            )}
        </>
    );
}
