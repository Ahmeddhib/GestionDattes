import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { redirect } from "next/navigation";
import { getLivreursAction } from "@/actions/livreurs/get-livreurs.action";
import { LivreursPageContent } from "./LivreursPageContent";

export default async function LivreursPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);
    const result = await getLivreursAction();
    if (!result.success) throw new Error(result.error || "Erreur lors du chargement des livreurs");
    return <LivreursPageContent livreurs={result.data || []} />;
}
