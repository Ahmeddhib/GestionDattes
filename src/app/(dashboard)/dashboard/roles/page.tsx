import { roleService } from "@/services/role.service";
import { RolesPageContent } from "./RolesPageContent";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata = {
    title: "Rôles — Gestion des Dattes",
};

async function RolesData() {
    const { data, total } = await roleService.getRoles();
    return <RolesPageContent initialData={data} initialTotal={total} />;
}

export default async function RolesPage() {
    return (
        <Suspense fallback={<TableSkeleton rows={5} />}>
            <RolesData />
        </Suspense>
    );
}
