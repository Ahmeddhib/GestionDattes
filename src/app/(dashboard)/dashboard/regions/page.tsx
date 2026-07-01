import { getRegionsAction } from "@/actions/regions/get-regions.action";
import { RegionsPageContent } from "./RegionsPageContent";

export default async function RegionsPage() {
    const result = await getRegionsAction();

    if (!result.success) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-50 p-4 text-red-600">
                    ❌ {result.error}
                </div>
            </div>
        );
    }

    return <RegionsPageContent regions={result.data || []} />;
}
