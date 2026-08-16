import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { TypesCaissesPageContent } from "./TypesCaissesPageContent";

export default async function TypesCaissesPage() {
    const result = await getTypesCaissesAction();

    if (!result.success) {
        return (
            <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                <div className="rounded-xl bg-red-50 p-4 text-red-600">
                    ❌ {result.error}
                </div>
            </div>
        );
    }

    const typesCaisses = result.data || [];

    return <TypesCaissesPageContent typesCaisses={typesCaisses} />;
}
