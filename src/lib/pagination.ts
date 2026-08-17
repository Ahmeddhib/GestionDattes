import { PAGINATION } from "@/constants/pagination";

/**
 * Socle de la pagination côté serveur.
 *
 * Un seul endroit décrit la forme d'une page de résultats et la façon dont les
 * paramètres d'URL sont lus. Les repositories n'ont donc qu'à traduire des
 * paramètres déjà validés en `skip` / `take` / `orderBy`.
 */

export interface PaginatedResult<T> {
    items: T[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    /** Rang de la première ligne affichée, en base 1. `0` si la page est vide. */
    startIndex: number;
    /** Rang de la dernière ligne affichée, en base 1. `0` si la page est vide. */
    endIndex: number;
}

export type SortDirection = "asc" | "desc";

export interface QueryParams {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortDir: SortDirection;
}

/** Paramètres d'URL bruts, tels que Next les fournit. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function premier(valeur: string | string[] | undefined): string | undefined {
    return Array.isArray(valeur) ? valeur[0] : valeur;
}

function entierBorne(brut: string | undefined, defaut: number, min: number, max: number): number {
    const n = Number.parseInt(brut ?? "", 10);
    if (!Number.isFinite(n)) return defaut;
    return Math.min(Math.max(n, min), max);
}

/**
 * Lit les paramètres de pagination depuis l'URL.
 *
 * Toute valeur absurde (négative, non numérique, démesurée) est ramenée dans
 * les bornes plutôt que rejetée : une URL bricolée doit produire une page
 * valide, pas une erreur. `pageSize` est plafonné par `PAGINATION.MAX_PAGE_SIZE`
 * — sans quoi `?pageSize=100000` permettrait de vider une table en une requête.
 */
export function parseQueryParams(
    params: RawSearchParams,
    defauts?: { pageSize?: number; sortBy?: string; sortDir?: SortDirection }
): QueryParams {
    const sortDirBrut = premier(params.sortDir);

    return {
        page: entierBorne(premier(params.page), 1, 1, Number.MAX_SAFE_INTEGER),
        pageSize: entierBorne(
            premier(params.pageSize),
            defauts?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MIN_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        ),
        search: (premier(params.search) ?? "").trim(),
        sortBy: premier(params.sortBy) ?? defauts?.sortBy ?? "",
        sortDir: sortDirBrut === "asc" || sortDirBrut === "desc"
            ? sortDirBrut
            : defauts?.sortDir ?? "desc",
    };
}

/**
 * Lit une borne de date depuis l'URL, en incluant la journée entière.
 *
 * `"debut"` cale à 00:00:00 et `"fin"` à 23:59:59.999 : sans cela, une borne
 * haute au format `YYYY-MM-DD` vaudrait minuit et exclurait silencieusement
 * toutes les lignes du dernier jour sélectionné.
 *
 * Une date invalide est ignorée plutôt que rejetée — une URL bricolée ne doit
 * pas casser la page.
 */
export function parseBorneDate(
    brut: string | string[] | undefined,
    borne: "debut" | "fin"
): Date | undefined {
    const valeur = premier(brut);
    if (!valeur) return undefined;

    const date = new Date(valeur);
    if (Number.isNaN(date.getTime())) return undefined;

    if (borne === "debut") date.setHours(0, 0, 0, 0);
    else date.setHours(23, 59, 59, 999);

    return date;
}

/**
 * Convertit une clé de tri venue de l'URL en `orderBy` Prisma.
 *
 * ⚠️ Le point de sécurité de toute cette infrastructure. On ne construit
 * JAMAIS un `orderBy` à partir du texte de l'URL : la clé sert uniquement à
 * choisir une entrée d'une table écrite à la main. Une clé inconnue retombe
 * sur le tri par défaut. Cela ferme aussi la porte au tri sur une colonne
 * non indexée, qui provoquerait un tri en mémoire côté base.
 */
export function resolveOrderBy<TOrderBy>(
    sortBy: string,
    sortDir: SortDirection,
    champsTriables: Record<string, (dir: SortDirection) => TOrderBy>,
    triParDefaut: (dir: SortDirection) => TOrderBy,
    dirParDefaut: SortDirection = "desc"
): TOrderBy {
    const constructeur = champsTriables[sortBy];
    return constructeur ? constructeur(sortDir) : triParDefaut(dirParDefaut);
}

/**
 * Assemble le résultat paginé à partir de la page de lignes et du total.
 *
 * `page` est réajusté quand il dépasse le nombre de pages réel : supprimer les
 * dernières lignes alors qu'on est sur la dernière page ne doit pas afficher un
 * tableau vide avec « Page 7 sur 3 ».
 */
export function buildPaginatedResult<T>(
    items: T[],
    totalItems: number,
    page: number,
    pageSize: number
): PaginatedResult<T> {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;

    return {
        items,
        currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        startIndex,
        endIndex: totalItems === 0 ? 0 : startIndex + items.length - 1,
    };
}

/**
 * `skip` / `take` pour Prisma. Extrait ici pour que la correspondance
 * « page 1 ⇒ skip 0 » ne soit écrite qu'une fois.
 */
export function toSkipTake(page: number, pageSize: number) {
    return { skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Exécute une requête paginée et garantit qu'une page hors bornes affiche
 * quand même des lignes.
 *
 * `buildPaginatedResult` ne peut que corriger le NUMÉRO affiché : au moment où
 * il s'exécute, la requête est partie avec le `skip` d'origine et n'a rien
 * ramené. `?page=999` produisait ainsi « Page 3 sur 3 » au-dessus d'un tableau
 * vide. On relit donc la dernière page réelle — un aller-retour supplémentaire,
 * mais uniquement dans ce cas de bord.
 *
 * `fetch` et `count` partent en parallèle : ils sont indépendants.
 */
export async function paginate<T>(
    page: number,
    pageSize: number,
    fetch: (skip: number, take: number) => Promise<T[]>,
    count: () => Promise<number>
): Promise<PaginatedResult<T>> {
    const { skip, take } = toSkipTake(page, pageSize);
    const [items, totalItems] = await Promise.all([fetch(skip, take), count()]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (items.length === 0 && totalItems > 0 && page > totalPages) {
        const derniere = toSkipTake(totalPages, pageSize);
        return buildPaginatedResult(
            await fetch(derniere.skip, derniere.take),
            totalItems,
            totalPages,
            pageSize
        );
    }

    return buildPaginatedResult(items, totalItems, page, pageSize);
}

/** Résultat paginé vide, pour les cas d'erreur ou d'accès refusé. */
export function emptyPaginatedResult<T>(pageSize = PAGINATION.DEFAULT_PAGE_SIZE): PaginatedResult<T> {
    return buildPaginatedResult<T>([], 0, 1, pageSize);
}
