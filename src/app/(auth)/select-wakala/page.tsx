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

    // Si aucun tenant, afficher erreur
    if (tenants.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF0DC]">
                <div className="bg-white p-8 rounded-[14px] shadow-lg max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Aucune Wakala Assignée
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Votre compte n'est associé à aucune Wakala. Veuillez contacter
                        l'administrateur système.
                    </p>
                </div>
            </div>
        );
    }

    // Si un seul tenant, rediriger automatiquement
    // (Cette partie sera gérée par le middleware après login)

    return <WakalaSelectorContent tenants={tenants} user={session.user} />;
}
