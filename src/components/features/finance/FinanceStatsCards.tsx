"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import {
    Wallet,
    TrendingDown,
    Scale,
    ShoppingCart,
    Users,
    HandCoins,
    TrendingUp,
} from "lucide-react";

interface FinanceStatsCardsProps {
    bilan: {
        totalEncaissementsClients: number;
        argentSorti: number;
        tresorerieNette: number;
        chiffreAffaires: number;
        creancesClients: number;
        dettesAgriculteurs: number;
        resultatNet: number;
    };
}

export function FinanceStatsCards({ bilan }: FinanceStatsCardsProps) {
    const { t } = useClientTranslations();

    const cards = [
        {
            label: t("finance.bilan.totalEncaisse"),
            value: bilan.totalEncaissementsClients,
            icon: Wallet,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            valueColor: "text-green-600",
        },
        {
            label: t("finance.bilan.totalSorti"),
            value: bilan.argentSorti,
            icon: TrendingDown,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            valueColor: "text-red-600",
        },
        {
            label: t("finance.bilan.tresorerieNette"),
            value: bilan.tresorerieNette,
            icon: Scale,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            valueColor: bilan.tresorerieNette >= 0 ? "text-blue-600" : "text-red-600",
        },
        {
            label: t("finance.bilan.chiffreAffaires"),
            value: bilan.chiffreAffaires,
            icon: ShoppingCart,
            iconBg: "bg-muted",
            iconColor: "text-[#C17A2B]",
            valueColor: "text-foreground",
        },
        {
            label: t("finance.bilan.creancesClients"),
            value: bilan.creancesClients,
            icon: Users,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            valueColor: "text-orange-600",
        },
        {
            label: t("finance.bilan.dettesAgriculteurs"),
            value: bilan.dettesAgriculteurs,
            icon: HandCoins,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            valueColor: "text-orange-600",
        },
        {
            label: t("finance.bilan.resultatNet"),
            value: bilan.resultatNet,
            icon: TrendingUp,
            iconBg: "bg-muted",
            iconColor: "text-[#C17A2B]",
            valueColor: bilan.resultatNet >= 0 ? "text-[#C17A2B]" : "text-red-600",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className="bg-card p-6 rounded-lg border border-border shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                <p className={`text-2xl font-bold mt-2 ${card.valueColor}`}>
                                    {card.value.toFixed(2)}
                                </p>
                            </div>
                            <div className={`h-12 w-12 ${card.iconBg} rounded-md flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${card.iconColor}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
