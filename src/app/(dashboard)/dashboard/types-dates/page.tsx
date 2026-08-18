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
            <div className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    Erreur: {result.error}
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">Chargement...</div>}>
            <TypesDatesPageContent typesDates={result.data || []} />
        </Suspense>
    );
}
