import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { UsersTable } from "@/components/features/users/UsersTable";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata = {
    title: "Utilisateurs — Gestion des Dattes",
};

async function UsersData() {
    const [usersResult, rolesResult] = await Promise.all([
        userService.getUsers(),
        roleService.getRoles(),
    ]);

    return (
        <UsersTable
            initialData={usersResult.data}
            initialTotal={usersResult.total}
            roles={rolesResult.data}
        />
    );
}

export default async function UsersPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<TableSkeleton rows={8} />}>
                <UsersData />
            </Suspense>
        </div>
    );
}
