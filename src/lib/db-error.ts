/**
 * Reconnaissance des pannes de connexion à la base.
 *
 * Module volontairement sans aucune dépendance : il est ainsi testable seul, et
 * utilisable aussi bien côté action que dans une frontière d'erreur.
 */

/**
 * Codes signalant que la base n'a pas pu être atteinte — réseau ou
 * initialisation Prisma. `P1001`/`P1002` sont les codes Prisma « serveur
 * inaccessible » et « délai dépassé ».
 */
const CODES_CONNEXION = new Set([
    "ETIMEDOUT",
    "ENETUNREACH",
    "ECONNREFUSED",
    "ECONNRESET",
    "EAI_AGAIN",
    "P1000",
    "P1001",
    "P1002",
    "P1017",
]);

/**
 * Reconnaît une panne de connexion à la base, y compris enveloppée.
 *
 * L'adaptateur Neon lève un `ErrorEvent` qui n'est PAS une instance de `Error`
 * et dont l'erreur réelle est imbriquée (`error` → `AggregateError` →
 * `errors[]`). Ces objets retombaient donc sur « Erreur inconnue », voire
 * s'affichaient en « [object Object] ». On descend dans les quelques champs
 * porteurs, à profondeur bornée pour ne pas parcourir un graphe cyclique.
 */
export function estErreurConnexionBase(valeur: unknown, profondeur = 0): boolean {
    if (profondeur > 4 || !valeur || typeof valeur !== "object") return false;

    const objet = valeur as Record<string, unknown>;

    const code = objet.code ?? objet.errorCode;
    if (typeof code === "string" && CODES_CONNEXION.has(code)) return true;

    // Toute erreur d'infrastructure Prisma porte `clientVersion`. Les erreurs
    // Prisma « normales » (validation, contrainte) sont de vraies `Error` avec un
    // message utile : elles ne doivent PAS être captées ici.
    if (typeof objet.clientVersion === "string" && !(valeur instanceof Error)) return true;

    for (const cle of ["error", "cause", "sourceError"]) {
        if (estErreurConnexionBase(objet[cle], profondeur + 1)) return true;
    }

    if (Array.isArray(objet.errors)) {
        return objet.errors.some((e) => estErreurConnexionBase(e, profondeur + 1));
    }

    return false;
}
