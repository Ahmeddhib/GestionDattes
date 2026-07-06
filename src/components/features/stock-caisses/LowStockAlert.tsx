"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type LowStockAlertProps = {
    typesCaisses?: Array<{
        id: string;
        nom: string;
        stockDisponible: number;
        poidsKg: number;
    }>;
};

export function LowStockAlert({ typesCaisses = [] }: LowStockAlertProps) {
    const { t } = useClientTranslations();

    // Filtrer les types avec stock faible (<20)
    const lowStockTypes = typesCaisses.filter((type) => type.stockDisponible < 20);

    if (lowStockTypes.length === 0) {
        return null;
    }

    return (
        <Alert className="rounded-[14px] border-orange-500 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-800 font-semibold">
                {t("pretsCaisses.alerteStockFaible")}
            </AlertTitle>
            <AlertDescription className="text-orange-700 mt-2">
                <div className="space-y-1">
                    {lowStockTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between">
                            <span className="font-medium">
                                {type.nom} ({type.poidsKg} kg)
                            </span>
                            <span
                                className={`font-bold ${type.stockDisponible === 0
                                    ? "text-red-600"
                                    : "text-orange-600"
                                    }`}
                            >
                                {type.stockDisponible === 0
                                    ? t("pretsCaisses.stockEpuise")
                                    : `${type.stockDisponible} ${t("pretsCaisses.restant")}`}
                            </span>
                        </div>
                    ))}
                </div>
            </AlertDescription>
        </Alert>
    );
}
