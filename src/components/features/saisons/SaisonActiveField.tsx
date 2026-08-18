"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export interface SaisonActive {
    id: string;
    nom: string;
}

/**
 * Affiche la saison à laquelle la nouvelle opération sera rattachée, en
 * lecture seule. Volontairement un Input désactivé et non un Select :
 * l'utilisateur ne choisit jamais la saison, elle est toujours résolue
 * côté serveur par `getSaisonOuverte` au moment de l'écriture.
 */
export function SaisonActiveField({ saison }: { saison: SaisonActive }) {
    const { t } = useClientTranslations();

    return (
        <div className="space-y-2">
            <Label htmlFor="saison-active">{t("finance.saisons.saisonActive")}</Label>
            <Input
                id="saison-active"
                value={saison.nom}
                disabled
                readOnly
                className="bg-muted text-foreground disabled:opacity-100"
            />
        </div>
    );
}
