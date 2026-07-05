import { Suspense } from "react";
import { getLivraisonsAction } from "@/actions/livraisons/get-livraisons.action";
import { LivraisonsPageContent } from "./LivraisonsPageContent";

export const metadata = {
    title: "Livraisons - Gestion Dattes",
    description: "Gestion des livraisons de dattes",
};

export default async function LivraisonsPage() {
    const result = await getLivraisonsAction();

    if (!result.success) {
        return (
            <div className="flex-1 p-8">
                <div className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-red-800">
                    Erreur: {result.error}
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="flex-1 p-8">Chargement...</div>}>
            <LivraisonsPageContent livraisons={result.data || []} />
        </Suspense>
    );
}
