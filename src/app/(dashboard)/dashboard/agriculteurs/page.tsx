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
            <div className="p-8">
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
