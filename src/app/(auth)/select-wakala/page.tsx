import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";
import WakalaSelectorContent from "./WakalaSelectorContent";
import { prisma } from "@/lib/prisma";

export default async function SelectWakalaPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Si l'utilisateur a déjà un tenant sélectionné, rediriger
    if (session.user.tenantId) {
        redirect("/dashboard");
    }

    const [tenants, adminMembership] = await Promise.all([
        getUserTenants(session.user.id),
        prisma.tenantUser.findFirst({
            where: {
                userId: session.user.id,
                active: true,
                Role: { name: "ADMIN" },
            },
            select: { id: true },
        }),
    ]);
    const canCreateWakala = Boolean(adminMembership);

    // Si aucun tenant, permettre à l'utilisateur de créer une wakala
    if (tenants.length === 0) {
        return <WakalaSelectorContent tenants={[]} user={session.user} canCreateWakala={canCreateWakala} />;
    }

    // Si un seul tenant, rediriger automatiquement
    // (Cette partie sera gérée par le middleware après login)

    return <WakalaSelectorContent tenants={tenants} user={session.user} canCreateWakala={canCreateWakala} />;
}
