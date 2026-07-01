"use client";

import { UsersTable } from "@/components/features/users/UsersTable";
import { useClientTranslations } from "@/hooks/useClientTranslations";

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
    const { t } = useClientTranslations();

    return (
        <div className="p-8">
            <UsersTable
                initialData={initialData}
                initialTotal={initialTotal}
                roles={roles}
            />
        </div>
    );
}
