import { getAgricultureursAction } from "@/actions/agriculteurs/get-agriculteurs.action";
import { getRegionsAction } from "@/actions/regions/get-regions.action";
import { AgricultureursPageContent } from "./AgricultureursPageContent";

export default async function AgricultureursPage() {
    const [agriculteursResult, regionsResult] = await Promise.all([
        getAgricultureursAction(),
        getRegionsAction(),
    ]);

    if (!agriculteursResult.success) {
        return (
            <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                <div className="rounded-xl bg-red-50 p-4 text-red-600">
                    ❌ {agriculteursResult.error}
                </div>
            </div>
        );
    }

    const agriculteurs = agriculteursResult.data || [];
    const regions = regionsResult.success ? regionsResult.data || [] : [];

    return <AgricultureursPageContent agriculteurs={agriculteurs} regions={regions} />;
}
