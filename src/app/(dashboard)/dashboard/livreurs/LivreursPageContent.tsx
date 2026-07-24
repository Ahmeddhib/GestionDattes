"use client";

import { Contact } from "lucide-react";
import { LivreurDialog } from "@/components/features/livreurs/LivreurDialog";
import { LivreursTable } from "@/components/features/livreurs/LivreursTable";
import type { Livreur } from "@/components/features/livreurs/columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function LivreursPageContent({ livreurs }: { livreurs: Livreur[] }) {
    const { t } = useClientTranslations();
    const actifs = livreurs.filter((livreur) => livreur.active).length;
    return <div className="space-y-6 p-6">
        <div className="flex items-center justify-between"><div><h1 className="flex items-center gap-3 text-3xl font-bold text-[#3D1C00]"><Contact className="h-8 w-8 text-[#C17A2B]" />{t("livreurs.title")}</h1><p className="mt-2 text-gray-600">{t("livreurs.description")}</p></div><LivreurDialog /></div>
        <div className="grid gap-6 md:grid-cols-2"><div className="rounded-[14px] border bg-white p-6"><p className="text-sm text-gray-600">{t("livreurs.total")}</p><p className="mt-2 text-3xl font-bold text-[#3D1C00]">{livreurs.length}</p></div><div className="rounded-[14px] border bg-white p-6"><p className="text-sm text-gray-600">{t("livreurs.active")}</p><p className="mt-2 text-3xl font-bold text-green-600">{actifs}</p></div></div>
        <div className="rounded-[14px] border bg-white"><LivreursTable data={livreurs} /></div>
    </div>;
}
