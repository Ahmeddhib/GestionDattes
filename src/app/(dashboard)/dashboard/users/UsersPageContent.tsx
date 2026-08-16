"use client";

import { UsersTable } from "@/components/features/users/UsersTable";
import { PageContainer } from "@/components/shared/PageContainer";

interface User {
    id: string;
    name: string;
    email: string;
    active: boolean;
    role: {
        id: string;
        name: string;
    };
    createdAt: Date;
}

interface UsersPageContentProps {
    initialData: User[];
    initialTotal: number;
    roles: Array<{ id: string; name: string }>;
}

export function UsersPageContent({ initialData, initialTotal, roles }: UsersPageContentProps) {
    return (
        <PageContainer>
            <UsersTable
                initialData={initialData}
                initialTotal={initialTotal}
                roles={roles}
            />
        </PageContainer>
    );
}
