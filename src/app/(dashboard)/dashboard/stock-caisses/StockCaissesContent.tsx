"use client";

import { Badge } from "@/components/ui/badge";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface TypeCaisse {
    id: string;
    nom: string;
    poidsKg: number;
    stockDisponible: number;
}

interface StockCaissesContentProps {
    typesCaisses: TypeCaisse[];
}

export function StockCaissesContent({ typesCaisses }: StockCaissesContentProps) {
    const { t } = useClientTranslations();

    return (
        <div className="rounded-[14px] bg-white p-4 md:p-6 shadow-sm border border-[#C17A2B]/20">
            <h2 className="text-lg md:text-xl font-semibold text-[#3D1C00] mb-4">
                {t('pretsCaisses.stockParType')}
            </h2>
            <div className="space-y-2">
                {!typesCaisses || typesCaisses.length === 0 ? (
                    <div className="text-center py-8 text-[#3D1C00]/60">
                        {t('pretsCaisses.aucunTypeCaisse')}
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

                        const stockLabel =
                            stock === 0
                                ? t('pretsCaisses.epuise')
                                : stock < 20
                                    ? t('pretsCaisses.faible')
                                    : stock < 50
                                        ? t('pretsCaisses.moyen')
                                        : t('pretsCaisses.bon');

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
                                        {type.poidsKg} {t('typesCaisses.kg')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xl md:text-2xl font-bold text-[#C17A2B]">
                                            {stock}
                                        </p>
                                        <p className="text-xs text-[#3D1C00]/60">
                                            {t('pretsCaisses.disponibles')}
                                        </p>
                                    </div>
                                    <Badge
                                        className={`${stockColor} rounded-[7px] font-semibold px-2 py-1 text-xs`}
                                    >
                                        {stockLabel}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
