"use client";

import { Grape } from "lucide-react";
import { TypesDatesTableAdvanced } from "@/components/features/types-dates/TypesDatesTableAdvanced";
import { CreateTypeDateDialog } from "@/components/features/types-dates/CreateTypeDateDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";

type TypeDate = {
    id: string;
    nom: string;
    description: string | null;
    seuilAlerte: number | null;
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
        <PageContainer>
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {t("typesDates.title")}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t("typesDates.description")}
                            </p>
                        </div>
                    </div>
                </div>
                <CreateTypeDateDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("typesDates.total")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                {typesDates.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("typesDates.totalUsage")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">{totalUsage}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <TypesDatesTableAdvanced typesDates={typesDates} />
        </PageContainer>
    );
}
