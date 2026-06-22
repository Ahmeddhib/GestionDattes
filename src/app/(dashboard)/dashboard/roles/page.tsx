import { getRolesAction } from "@/actions/roles/get-roles.action";
import RolesClient from "./roles-client";
import { redirect } from "next/navigation";

export default async function RolesPage() {
    const res = await getRolesAction();

    if (res.error) {
        if (res.error === "Non authentifié") redirect("/login");
        return <div className="p-8 text-red-500">{res.error}</div>;
    }

    return <RolesClient initialRoles={res.roles || []} />;
}
