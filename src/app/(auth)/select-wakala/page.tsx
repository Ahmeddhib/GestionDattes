import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserTenants } from "@/lib/tenant/get-tenant";
import WakalaSelectorContent from "./WakalaSelectorContent";

export default async function SelectWakalaPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Si l'utilisateur a déjà un tenant sélectionné, rediriger
    if (session.user.tenantId) {
        redirect("/dashboard");
    }

    // Récupérer les Wakalas de l'utilisateur
    const tenants = await getUserTenants(session.user.id);

    // Si aucun tenant, permettre à l'utilisateur de créer une wakala
    if (tenants.length === 0) {
        return <WakalaSelectorContent tenants={[]} user={session.user} />;
    }

    // Si un seul tenant, rediriger automatiquement
    // (Cette partie sera gérée par le middleware après login)

    return <WakalaSelectorContent tenants={tenants} user={session.user} />;
}
