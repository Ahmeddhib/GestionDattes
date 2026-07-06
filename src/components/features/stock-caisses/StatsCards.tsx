"use client";

import { Package, TrendingUp, Clock } from "lucide-react";

type StatsCardsProps = {
    stats: {
        totalPrete: number;
        totalRetourne: number;
        restant: number;
        pretsEnCours: number;
    };
};

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#C17A2B]/20">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#C17A2B]/10 p-3">
                        <Package className="h-6 w-6 text-[#C17A2B]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Total Prêté</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.totalPrete}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-green-200">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Total Retourné</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.totalRetourne}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-orange-200">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-orange-100 p-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Prêts En Cours</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.pretsEnCours}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
