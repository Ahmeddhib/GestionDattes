"use client";

import { Badge } from "@/components/ui/badge";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { cn } from "@/lib/utils";

/**
 * Saison d'ORIGINE d'un lot de stock — la campagne pendant laquelle il est
 * entré, jamais réécrite (voir `StockDate.saisonOrigineId`).
 *
 * Composant unique partagé par le sélecteur de vente et le tableau des ventes,
 * pour que la règle d'affichage ne soit pas écrite deux fois et ne diverge pas.
 *
 * ⚠️ `estReporte` ne se calcule PAS de la même façon des deux côtés, et c'est
 * volontaire :
 *  - dans le formulaire, on compare à la saison OUVERTE (la vente en cours de
 *    création lui sera rattachée) ;
 *  - dans le tableau, on compare à la saison DE CETTE VENTE — sinon une vente
 *    conclue il y a deux campagnes serait requalifiée « report » à chaque
 *    clôture.
 */
export function SaisonOrigineBadge({
    saisonNom,
    estReporte,
    className,
}: {
    saisonNom: string;
    estReporte: boolean;
    className?: string;
}) {
    const { t } = useClientTranslations();

    return (
        <Badge
            variant="outline"
            className={cn(
                // Le nom de saison est libre et peut être long (« Historique
                // (avant module Saisons) »). `shrink-0` le rendait indéformable :
                // sur un écran étroit il poussait la ligne hors du champ. Il cède
                // ici, et le texte s'abrège — le `title` garde la valeur entière.
                "min-w-0 max-w-full shrink font-normal",
                estReporte
                    ? // Ambre : se repère d'un coup d'œil dans une liste. Couleurs
                      // fixes volontairement — elles doivent alerter dans les deux
                      // thèmes, clair comme sombre.
                      "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-border text-muted-foreground",
                className
            )}
            title={
                estReporte
                    ? `${t("finance.ventes.saisonOrigine", { nom: saisonNom })} · ${t("finance.ventes.reporte")}`
                    : t("finance.ventes.saisonOrigine", { nom: saisonNom })
            }
        >
            {/* `Badge` est un `inline-flex` en `overflow-hidden` : un texte nu y
                serait coupé net. Passé dans un enfant `truncate`, il s'abrège
                proprement par des points de suspension. */}
            <span className="min-w-0 truncate">
                {saisonNom}
                {estReporte && ` · ${t("finance.ventes.reporte")}`}
            </span>
        </Badge>
    );
}
