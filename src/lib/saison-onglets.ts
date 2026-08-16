/**
 * Onglets de la page de détail d'une saison.
 *
 * L'onglet actif est porté par la query string (`?tab=`) et non par un état
 * React : il survit ainsi au rafraîchissement, au partage d'URL et au retour
 * arrière. Un seul panneau est rendu à la fois, côté serveur — c'est ce qui
 * permet d'avoir onze domaines sans charger onze jeux de données.
 */
export const ONGLETS_SAISON = [
    "apercu",
    "livraisons",
    "pesees",
    "bons-achat",
    "ventes",
    "paiements",
    "encaissements",
    "depenses",
    "stock",
    "caisses",
    "audit",
] as const;

export type OngletSaison = (typeof ONGLETS_SAISON)[number];

/**
 * Clé du libellé sous `finance.saisons.detail.tabs`. Les identifiants d'onglet
 * apparaissent dans l'URL et sont donc en kebab-case, alors que les clés i18n
 * suivent la convention camelCase du reste des traductions.
 */
export const CLE_LIBELLE_ONGLET: Record<OngletSaison, string> = {
    apercu: "apercu",
    livraisons: "livraisons",
    pesees: "pesees",
    "bons-achat": "bonsAchat",
    ventes: "ventes",
    paiements: "paiements",
    encaissements: "encaissements",
    depenses: "depenses",
    stock: "stock",
    caisses: "caisses",
    audit: "audit",
};

/**
 * Un onglet inconnu retombe silencieusement sur l'aperçu : une URL tronquée ou
 * un ancien favori ne doit jamais produire d'erreur.
 */
export function parseOngletSaison(raw: string | undefined): OngletSaison {
    return ONGLETS_SAISON.includes(raw as OngletSaison) ? (raw as OngletSaison) : "apercu";
}
