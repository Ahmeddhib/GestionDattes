"use client";

import { useEffect } from "react";

/**
 * Restaure la position de défilement lors des retours arrière du navigateur.
 *
 * Le shell du dashboard occupe exactement la hauteur de l'écran : c'est
 * `<main>` qui défile, plus la fenêtre. Or Next.js et le navigateur ne savent
 * restaurer que le défilement de la FENÊTRE — sans ce composant, revenir d'une
 * fiche vers une longue liste repartait systématiquement du haut.
 *
 * La restauration n'a lieu que sur un `popstate` (retour / suivant). Une
 * navigation normale continue d'afficher la nouvelle page en haut.
 */
export function MainScrollRestoration() {
    useEffect(() => {
        const main = document.querySelector("main");
        if (!main) return;

        const cle = () => `scroll:${window.location.pathname}${window.location.search}`;

        // La sauvegarde se fait pendant le défilement, jamais au démontage :
        // au moment où l'effet serait nettoyé, l'URL a déjà changé et on
        // enregistrerait la position sous la clé de la page suivante.
        const memoriser = () => {
            sessionStorage.setItem(cle(), String(main.scrollTop));
        };
        main.addEventListener("scroll", memoriser, { passive: true });

        // La restauration se fait DANS le handler `popstate`, et non dans un
        // effet dépendant du pathname : Next.js applique la nouvelle route
        // avant que l'événement n'atteigne les écouteurs de la page, si bien
        // qu'un tel effet s'exécuterait toujours trop tôt, avant d'avoir pu
        // savoir qu'il s'agissait d'un retour arrière.
        const surRetour = () => {
            const cible = Number(sessionStorage.getItem(cle()) ?? 0);
            if (cible <= 0) return;

            // Le contenu peut encore arriver en streaming : tant qu'il n'a pas
            // sa hauteur finale, `scrollTop` est écrêté. On réessaie sur
            // quelques frames plutôt que de parier sur un délai fixe.
            const limite = performance.now() + 1500;
            const tenter = () => {
                main.scrollTop = cible;
                if (Math.abs(main.scrollTop - cible) > 2 && performance.now() < limite) {
                    requestAnimationFrame(tenter);
                }
            };
            requestAnimationFrame(tenter);
        };
        window.addEventListener("popstate", surRetour);

        return () => {
            main.removeEventListener("scroll", memoriser);
            window.removeEventListener("popstate", surRetour);
        };
    }, []);

    return null;
}
