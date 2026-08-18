"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function RefreshButton() {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [isPending, startTransition] = useTransition();
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        // Intentionnel : lastUpdated doit rester `null` au rendu serveur pour éviter un
        // mismatch d'hydratation (l'heure du serveur et celle du client diffèrent), puis
        // se remplir uniquement côté client une fois monté.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastUpdated(new Date());
    }, []);

    function handleRefresh() {
        startTransition(() => {
            router.refresh();
            setLastUpdated(new Date());
        });
    }

    return (
        <div className="flex items-center gap-3">
            {lastUpdated && (
                <span className="text-xs text-gray-500 dark:text-text-hint">
                    {t("dashboard.refreshedAt", {
                        time: lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                    })}
                </span>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPending}
                className="gap-2 rounded-md border-[#C17A2B]/30 text-[#3D1C00] dark:text-dattes-100"
            >
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                {t("dashboard.refresh")}
            </Button>
        </div>
    );
}
