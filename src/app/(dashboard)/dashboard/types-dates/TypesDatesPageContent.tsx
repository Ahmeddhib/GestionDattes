"use client";

import { Grape } from "lucide-react";
import { TypesDatesTableAdvanced } from "@/components/features/types-dates/TypesDatesTableAdvanced";
import { CreateTypeDateDialog } from "@/components/features/types-dates/CreateTypeDateDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type TypeDate = {
    id: string;
    nom: string;
    description: string | null;
    _count?: {
        livraisons: number;
        stocksDates: number;
    };
};

type TypesDatesPageContentProps = {
    typesDates: TypeDate[];
};

export function TypesDatesPageContent({ typesDates }: TypesDatesPageContentProps) {
    const { t } = useClientTranslations();

    const totalUsage = typesDates.reduce(
        (acc, type) =>
            acc +
            (type._count?.livraisons || 0) +
            (type._count?.stocksDates || 0),
        0
    );

    return (
        <div className="flex-1 space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#3D1C00]">
                                {t("typesDates.title")}
                            </h1>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesDates.description")}
                            </p>
                        </div>
                    </div>
                </div>
                <CreateTypeDateDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesDates.total")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">
                                {typesDates.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("typesDates.totalUsage")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">{totalUsage}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <TypesDatesTableAdvanced typesDates={typesDates} />
        </div>
    );
}
