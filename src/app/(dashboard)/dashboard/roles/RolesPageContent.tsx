"use client";

import { RolesTable } from "@/components/features/roles/RolesTable";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface Role {
    id: string;
    name: string;
    description: string | null;
    _count: {
        users: number;
    };
    createdAt: Date;
}

interface RolesPageContentProps {
    initialData: Role[];
    initialTotal: number;
}

export function RolesPageContent({ initialData, initialTotal }: RolesPageContentProps) {
    const { t } = useClientTranslations();

    return (
        <div className="p-8">
            <RolesTable initialData={initialData} initialTotal={initialTotal} />
        </div>
    );
}
