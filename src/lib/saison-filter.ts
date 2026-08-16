import { prisma } from "@/lib/prisma";

/**
 * Résolution du filtre "saison" des pages de liste. Point d'entrée unique :
 * toutes les pages passent par ici, ce qui garantit qu'un `saisonId` arrivant
 * de l'URL est toujours revalidé contre le tenant courant.
 */

export type SaisonScopeKind = "courante" | "precedente" | "toutes" | "id";

export interface SaisonLight {
    id: string;
    nom: string;
    statut: "OUVERTE" | "CLOTUREE";
}

export interface ResolvedSaisonFilter {
    kind: SaisonScopeKind;
    /** `undefined` ⇔ aucune restriction (mode "toutes"). */
    saisonId?: string;
    saison: SaisonLight | null;
    /** Une saison clôturée est consultable et exportable, mais non modifiable. */
    isReadOnly: boolean;
    /** Valeur à réinjecter dans le Select (`"toutes"` ou un id). */
    value: string;
}

const SELECT: { id: true; nom: true; statut: true } = { id: true, nom: true, statut: true };

/**
 * @param param valeur brute de `searchParams.saisonId` :
 *   - absente          → saison courante (comportement par défaut)
 *   - "toutes"         → aucune restriction
 *   - "precedente"     → saison précédant la saison ouverte
 *   - un id de saison  → cette saison, si elle appartient bien au tenant
 *
 * Un id inconnu ou appartenant à un autre tenant retombe silencieusement sur la
 * saison courante : jamais de fuite inter-Wakala, jamais d'erreur affichée.
 */
export async function resolveSaisonFilter(
    tenantId: string,
    param: string | undefined
): Promise<ResolvedSaisonFilter> {
    if (param === "toutes") {
        return { kind: "toutes", saisonId: undefined, saison: null, isReadOnly: false, value: "toutes" };
    }

    if (param && param !== "courante" && param !== "precedente") {
        const saison = await prisma.saison.findFirst({
            where: { id: param, tenantId },
            select: SELECT,
        });

        if (saison) {
            return {
                kind: "id",
                saisonId: saison.id,
                saison,
                isReadOnly: saison.statut === "CLOTUREE",
                value: saison.id,
            };
        }
        // id invalide → on retombe sur la saison courante ci-dessous.
    }

    const ouverte = await prisma.saison.findFirst({
        where: { tenantId, statut: "OUVERTE" },
        select: SELECT,
    });

    if (param === "precedente") {
        // La saison qui précède immédiatement la saison ouverte. Si aucune
        // n'est ouverte (entre une clôture et la création de la suivante), on
        // prend simplement la plus récente.
        const precedente = await prisma.saison.findFirst({
            where: {
                tenantId,
                ...(ouverte && { statut: "CLOTUREE" }),
                ...(ouverte && { id: { not: ouverte.id } }),
            },
            orderBy: { dateDebut: "desc" },
            select: SELECT,
        });

        if (precedente) {
            return {
                kind: "precedente",
                saisonId: precedente.id,
                saison: precedente,
                isReadOnly: precedente.statut === "CLOTUREE",
                value: "precedente",
            };
        }
    }

    return {
        kind: "courante",
        saisonId: ouverte?.id,
        saison: ouverte,
        isReadOnly: false,
        // Sans saison ouverte, le filtre "courante" ne restreint rien : on
        // bascule l'affichage sur "toutes" plutôt que de montrer une liste vide
        // sans explication.
        value: ouverte ? "courante" : "toutes",
    };
}

/** Liste des saisons du tenant, pour alimenter le Select. */
export async function listSaisonsPourFiltre(tenantId: string): Promise<SaisonLight[]> {
    return prisma.saison.findMany({
        where: { tenantId },
        orderBy: { dateDebut: "desc" },
        select: SELECT,
    });
}

/**
 * Tout ce dont une page de liste a besoin, en un appel : le `saisonId` à
 * passer au service, et les props du `SaisonFilterBar`.
 *
 * `saisonOuverte` sert aux pages de saisie : quand il vaut `null`, aucune
 * opération ne peut être créée et les formulaires doivent le dire.
 */
export async function getSaisonFiltrePourPage(tenantId: string, param: string | undefined) {
    const [filtre, saisons, saisonOuverte] = await Promise.all([
        resolveSaisonFilter(tenantId, param),
        listSaisonsPourFiltre(tenantId),
        prisma.saison.findFirst({ where: { tenantId, statut: "OUVERTE" }, select: SELECT }),
    ]);

    return {
        saisonId: filtre.saisonId,
        saisonOuverte,
        saisonFiltre: {
            saisons,
            value: filtre.value,
            isReadOnly: filtre.isReadOnly,
        },
    };
}
