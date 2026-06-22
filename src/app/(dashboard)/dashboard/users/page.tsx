import { getUsersAction } from "@/actions/users/get-users.action";
import { getRolesAction } from "@/actions/roles/get-roles.action";
import UsersClient from "./users-client";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const [usersRes, rolesRes] = await Promise.all([getUsersAction(), getRolesAction()]);

    if (usersRes.error) {
        if (usersRes.error === "Non authentifié") redirect("/login");
        return <div className="p-8 text-red-500">{usersRes.error}</div>;
    }

    if (rolesRes.error) {
        return <div className="p-8 text-red-500">{rolesRes.error}</div>;
    }

    return <UsersClient initialUsers={usersRes.users || []} roles={rolesRes.roles || []} />;
}
