"use client";

import { RolesTable } from "@/components/features/roles/RolesTable";
import { PageContainer } from "@/components/shared/PageContainer";

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
    return (
        <PageContainer>
            <RolesTable initialData={initialData} initialTotal={initialTotal} />
        </PageContainer>
    );
}
