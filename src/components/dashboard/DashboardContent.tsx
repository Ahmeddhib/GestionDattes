"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";

interface DashboardContentProps {
    userName: string;
}

export function DashboardContent({ userName }: DashboardContentProps) {
    const { t } = useClientTranslations();

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2C1A00] mb-2">
                {t('common.welcome')}, {userName} 👋
            </h1>
            <p className="text-gray-600">
                Voici un aperçu de votre système de gestion des dattes.
            </p>
        </div>
    );
}
