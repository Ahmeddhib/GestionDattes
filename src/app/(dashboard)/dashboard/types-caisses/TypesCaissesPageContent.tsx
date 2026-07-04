"use client";

import { Package } from "lucide-react";
import { TypesCaissesTableAdvanced } from "@/components/features/types-caisses/TypesCaissesTableAdvanced";
import { CreateTypeCaisseDialog } from "@/components/features/types-caisses/CreateTypeCaisseDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type TypeCaisse = {
    id: string;
    nom: string;
    poidsKg: number;
    _count?: {
        livraisons: number;
        pretsCaisses: number;
        bonsSortie: number;
        conditionnements: number;
    };
};

type TypesCaissesPageContentProps = {
    typesCaisses: TypeCaisse[];
};

export function TypesCaissesPageContent({ typesCaisses }: TypesCaissesPageContentProps) {
    const { t } = useClientTranslations();

    const totalUsage = typesCaisses.reduce(
        (acc, type) =>
            acc +
            (type._count?.livraisons || 0) +
            (type._count?.pretsCaisses || 0) +
            (type._count?.bonsSortie || 0) +
            (type._count?.conditionnements || 0),
        0
    );

    return (
        <div className="flex-1 space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Package className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#3D1C00]">
                                {t("typesCaisses.title")}
                            </h1>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesCaisses.description")}
                            </p>
                        </div>
                    </div>
                </div>
                <CreateTypeCaisseDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesCaisses.total")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">
                                {typesCaisses.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Package className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesCaisses.usage")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">{totalUsage}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Package className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">Poids Moyen</p>
                            <p className="text-2xl font-bold text-[#3D1C00]">
                                {typesCaisses.length > 0
                                    ? (
                                        typesCaisses.reduce((acc, t) => acc + t.poidsKg, 0) /
                                        typesCaisses.length
                                    ).toFixed(1)
                                    : 0}{" "}
                                {t("typesCaisses.kg")}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Package className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <TypesCaissesTableAdvanced typesCaisses={typesCaisses} />
        </div>
    );
}
