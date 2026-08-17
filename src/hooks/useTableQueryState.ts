"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortDirection } from "@/lib/pagination";

/**
 * État de tri / recherche / pagination d'une table, porté par l'URL.
 *
 * L'URL est la seule source de vérité : une page de résultats est ainsi
 * partageable, rechargeable et navigable au retour arrière. Aucun état
 * dupliqué côté client, sauf le texte de recherche en cours de frappe.
 */
export function useTableQueryState() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const sortBy = searchParams.get("sortBy") ?? "";
    const sortDir = (searchParams.get("sortDir") as SortDirection) ?? "desc";
    const search = searchParams.get("search") ?? "";

    /**
     * Applique des paramètres. Les clés vides sont retirées de l'URL pour
     * qu'elle reste lisible, et tout changement autre que la page ramène à la
     * page 1 — rester en page 7 après avoir tapé une recherche afficherait un
     * tableau vide sans explication.
     */
    const setParams = useCallback(
        (maj: Record<string, string | number | undefined>, options?: { resetPage?: boolean }) => {
            const params = new URLSearchParams(searchParams.toString());

            for (const [cle, valeur] of Object.entries(maj)) {
                if (valeur === undefined || valeur === "") params.delete(cle);
                else params.set(cle, String(valeur));
            }

            if (options?.resetPage !== false && !("page" in maj)) {
                params.delete("page");
            }

            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            });
        },
        [pathname, router, searchParams]
    );

    // ---------------------------------------------------------------- recherche
    // Le champ reste piloté localement pendant la frappe : passer par l'URL à
    // chaque caractère déclencherait une requête serveur par touche.
    const [searchDraft, setSearchDraft] = useState(search);
    const dejaMonte = useRef(false);

    // Resynchronisation pendant le rendu, et non dans un effet : quand la
    // recherche change côté URL sans venir du champ (retour arrière, lien
    // partagé), il faut réaligner le brouillon. Le faire dans un `useEffect`
    // provoquerait un rendu supplémentaire à chaque navigation.
    const [rechercheUrlVue, setRechercheUrlVue] = useState(search);
    if (search !== rechercheUrlVue) {
        setRechercheUrlVue(search);
        setSearchDraft(search);
    }

    useEffect(() => {
        if (!dejaMonte.current) {
            dejaMonte.current = true;
            return;
        }
        if (searchDraft === search) return;

        const minuteur = setTimeout(() => setParams({ search: searchDraft }), 350);
        return () => clearTimeout(minuteur);
        // `setParams` et `search` sont volontairement hors des dépendances :
        // les inclure relancerait le minuteur à chaque navigation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchDraft]);

    // ------------------------------------------------------------------- tri
    const toggleSort = useCallback(
        (champ: string) => {
            const memeChamp = sortBy === champ;
            setParams({
                sortBy: champ,
                sortDir: memeChamp && sortDir === "asc" ? "desc" : "asc",
            });
        },
        [setParams, sortBy, sortDir]
    );

    return {
        page,
        pageSize,
        sortBy,
        sortDir,
        search,
        searchDraft,
        setSearchDraft,
        setParams,
        toggleSort,
        goToPage: useCallback((p: number) => setParams({ page: p }, { resetPage: false }), [setParams]),
        setPageSize: useCallback((taille: number) => setParams({ pageSize: taille }), [setParams]),
        isPending,
    };
}

/**
 * Précharge la page suivante dès que la page courante est affichée.
 *
 * Next met en cache le rendu serveur préchargé : le clic sur « suivant »
 * devient alors quasi instantané. On ne précharge qu'une page — aller plus loin
 * ferait travailler la base pour des pages que l'utilisateur n'ouvrira
 * probablement jamais.
 */
export function usePrefetchNextPage(hasNextPage: boolean, page: number) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!hasNextPage) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page + 1));
        router.prefetch(`${pathname}?${params.toString()}`);
    }, [hasNextPage, page, pathname, router, searchParams]);
}
