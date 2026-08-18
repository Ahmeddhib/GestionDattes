"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClientTranslations } from "@/hooks/useClientTranslations";

/**
 * Signale qu'on consulte une saison clôturée : les données restent visibles et
 * exportables, mais aucune modification n'est possible. Le vrai blocage est
 * côté serveur (`assertSaisonOuverte`) — ce badge n'est qu'une explication.
 */
export function SaisonClotureeBadge({ withHint = false }: { withHint?: boolean }) {
    const { t } = useClientTranslations();

    return (
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-gray-200 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-[#d8c9b6] dark:hover:bg-white/15">
                <Lock className="h-3 w-3" />
                {t("finance.saisons.filtre.clotureeBadge")}
            </Badge>
            {withHint && (
                <span className="text-xs text-muted-foreground">
                    {t("finance.saisons.filtre.lectureSeule")}
                </span>
            )}
        </div>
    );
}
