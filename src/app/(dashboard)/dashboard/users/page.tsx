import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { UsersPageContent } from "./UsersPageContent";
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
        <UsersPageContent
            initialData={usersResult.data}
            initialTotal={usersResult.total}
            roles={rolesResult.data}
        />
    );
}

export default async function UsersPage() {
    return (
        <Suspense fallback={<TableSkeleton rows={8} />}>
            <UsersData />
        </Suspense>
    );
}
