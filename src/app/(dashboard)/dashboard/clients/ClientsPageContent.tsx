"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { ClientsTableAdvanced } from "@/components/features/clients/ClientsTableAdvanced";
import { CreateClientDialog } from "@/components/features/clients/CreateClientDialog";
import type { Client } from "@/components/features/clients/columns";
import { Users } from "lucide-react";

interface ClientsPageContentProps {
    clients: Client[];
}

export function ClientsPageContent({ clients }: ClientsPageContentProps) {
    const { t } = useClientTranslations();

    const totalClients = clients.length;
    const totalVentes = clients.reduce((sum, c) => sum + (c._count?.Vente || 0), 0);
    const clientsAvecVentes = clients.filter((c) => (c._count?.Vente || 0) > 0).length;

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <Users className="h-8 w-8 text-[#C17A2B]" />
                        {t("clients.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("clients.description")}</p>
                </div>
                <CreateClientDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("clients.stats.total")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">
                                {totalClients}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-[9px] flex items-center justify-center">
                            <Users className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("clients.stats.withSales")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">
                                {clientsAvecVentes}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-[9px] flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("clients.stats.totalSales")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">
                                {totalVentes}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-[9px] flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm">
                <ClientsTableAdvanced data={clients} />
            </div>
        </div>
    );
}
