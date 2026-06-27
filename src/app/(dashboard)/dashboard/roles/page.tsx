import { roleService } from "@/services/role.service";
import { RolesTable } from "@/components/features/roles/RolesTable";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata = {
    title: "Rôles — Gestion des Dattes",
};

async function RolesData() {
    const { data, total } = await roleService.getRoles();
    return <RolesTable initialData={data} initialTotal={total} />;
}

export default async function RolesPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<TableSkeleton rows={5} />}>
                <RolesData />
            </Suspense>
        </div>
    );
}
