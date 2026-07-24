"use client";

import { useState } from "react";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { createLivreurColumns, type Livreur } from "./columns";
import { LivreurDialog } from "./LivreurDialog";

export function LivreursTable({ data }: { data: Livreur[] }) {
    const { t } = useClientTranslations();
    const [editing, setEditing] = useState<Livreur | null>(null);
    const [deleting, setDeleting] = useState<Livreur | null>(null);
    return <>
        <DataTableAdvanced columns={createLivreurColumns(t, setEditing, setDeleting)} data={data} searchKey="nom" searchPlaceholder={t("livreurs.searchPlaceholder")} />
        <LivreurDialog key={editing?.id || "edit"} livreur={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(null)} />
        <LivreurDialog key={deleting?.id || "delete"} livreur={deleting} open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} deleteMode />
    </>;
}
