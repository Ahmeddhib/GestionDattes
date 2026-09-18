export type PretOuvertPourRetour = {
    id: string;
    nombrePrete: number;
    nombreRetourne: number;
};

/** Répartit un retour sur les prêts déjà triés du plus ancien au plus récent. */
export function repartirRetoursFifo(prets: PretOuvertPourRetour[], quantite: number) {
    const demandee = Math.max(0, quantite);
    let restant = demandee;
    const allocations: Array<{ pretId: string; quantite: number }> = [];

    for (const pret of prets) {
        if (restant === 0) break;
        const encoreDu = Math.max(0, pret.nombrePrete - pret.nombreRetourne);
        const aRetourner = Math.min(restant, encoreDu);
        if (aRetourner === 0) continue;
        allocations.push({ pretId: pret.id, quantite: aRetourner });
        restant -= aRetourner;
    }

    return { allocations, totalRetourne: demandee - restant, sansPret: restant };
}
