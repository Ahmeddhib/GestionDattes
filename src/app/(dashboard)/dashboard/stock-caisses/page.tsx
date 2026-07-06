import { Suspense } from "react";
import { getPretsAction, getPretsStatistiquesAction } from "@/actions/prets-caisses/get-prets.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { StatsCards } from "@/components/features/stock-caisses/StatsCards";
import { PretsTable } from "@/components/features/stock-caisses/PretsTable";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { LowStockAlert } from "@/components/features/stock-caisses/LowStockAlert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default async function StockCaissesPage() {
    const [statsResult, pretsResult, typesCaissesResult] = await Promise.all([
        getPretsStatistiquesAction(),
        getPretsAction(),
        getTypesCaissesAction(),
    ]);

    const stats = statsResult.success ? statsResult.data : null;
    const prets = pretsResult.success ? pretsResult.data : [];
    const typesCaisses = typesCaissesResult.success ? typesCaissesResult.data : [];

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#3D1C00]">
                        Stock de Caisses
                    </h1>
                    <p className="text-sm md:text-base text-[#3D1C00]/60">
                        Gestion du stock et des prêts de caisses
                    </p>
                </div>
                <CreatePretDialog />
            </div>

            {/* Alerte Stock Faible */}
            <LowStockAlert typesCaisses={typesCaisses} />

            {/* Stats - Mobile Responsive */}
            {stats && <StatsCards stats={stats} />}

            {/* Tableau Stock par Type - Mobile Responsive */}
            <div className="rounded-[14px] bg-white p-4 md:p-6 shadow-sm border border-[#C17A2B]/20">
                <h2 className="text-lg md:text-xl font-semibold text-[#3D1C00] mb-4">
                    Stock par Type de Caisse
                </h2>
                <div className="space-y-2">
                    {!typesCaisses || typesCaisses.length === 0 ? (
                        <div className="text-center py-8 text-[#3D1C00]/60">
                            Aucun type de caisse disponible
                        </div>
                    ) : (
                        typesCaisses.map((type) => {
                            const stock = type.stockDisponible || 0;
                            const stockColor =
                                stock === 0
                                    ? "bg-red-100 text-red-600"
                                    : stock < 20
                                        ? "bg-orange-100 text-orange-600"
                                        : stock < 50
                                            ? "bg-yellow-100 text-yellow-600"
                                            : "bg-green-100 text-green-600";

                            return (
                                <div
                                    key={type.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-[9px] bg-[#FAF0DC] border border-[#C17A2B]/20 gap-2"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-[#3D1C00] text-sm md:text-base">
                                            {type.nom}
                                        </p>
                                        <p className="text-xs md:text-sm text-[#3D1C00]/60">
                                            {type.poidsKg} kg
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xl md:text-2xl font-bold text-[#C17A2B]">
                                                {stock}
                                            </p>
                                            <p className="text-xs text-[#3D1C00]/60">
                                                Disponibles
                                            </p>
                                        </div>
                                        <Badge
                                            className={`${stockColor} rounded-[7px] font-semibold px-2 py-1 text-xs`}
                                        >
                                            {stock === 0
                                                ? "Épuisé"
                                                : stock < 20
                                                    ? "Faible"
                                                    : stock < 50
                                                        ? "Moyen"
                                                        : "Bon"}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tableau Prêts - Mobile Responsive */}
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <div className="overflow-x-auto">
                    <PretsTable prets={prets} />
                </div>
            </Suspense>
        </div>
    );
}
