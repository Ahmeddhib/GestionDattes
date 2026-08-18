"use client";

import { Contact } from "lucide-react";
import { LivreurDialog } from "@/components/features/livreurs/LivreurDialog";
import { LivreursTable } from "@/components/features/livreurs/LivreursTable";
import type { Livreur } from "@/components/features/livreurs/columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";

export function LivreursPageContent({ livreurs }: { livreurs: Livreur[] }) {
    const { t } = useClientTranslations();
    const actifs = livreurs.filter((livreur) => livreur.active).length;
    return <PageContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-[#3D1C00] sm:gap-3 sm:text-3xl"><Contact className="h-7 w-7 shrink-0 text-[#C17A2B] sm:h-8 sm:w-8" />{t("livreurs.title")}</h1><p className="mt-2 text-gray-600">{t("livreurs.description")}</p></div><div className="w-full sm:w-auto"><LivreurDialog /></div></div>
        <div className="grid gap-6 md:grid-cols-2"><div className="rounded-lg border bg-white p-6"><p className="text-sm text-gray-600">{t("livreurs.total")}</p><p className="mt-2 text-3xl font-bold text-[#3D1C00]">{livreurs.length}</p></div><div className="rounded-lg border bg-white p-6"><p className="text-sm text-gray-600">{t("livreurs.active")}</p><p className="mt-2 text-3xl font-bold text-green-600">{actifs}</p></div></div>
        <div className="rounded-lg border bg-white"><LivreursTable data={livreurs} /></div>
    </PageContainer>;
}
