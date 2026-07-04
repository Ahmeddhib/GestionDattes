import { Suspense } from "react";
import { getTypesDatesAction } from "@/actions/types-dates/get-types-dates.action";
import { TypesDatesPageContent } from "./TypesDatesPageContent";

export const metadata = {
    title: "Types de Dattes - Gestion Dattes",
    description: "Gestion des variétés de dattes",
};

export default async function TypesDatesPage() {
    const result = await getTypesDatesAction();

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
            <TypesDatesPageContent typesDates={result.data || []} />
        </Suspense>
    );
}
