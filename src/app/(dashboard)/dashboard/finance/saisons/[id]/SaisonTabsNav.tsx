import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import {
    ONGLETS_SAISON,
    CLE_LIBELLE_ONGLET,
    type OngletSaison,
} from "@/lib/saison-onglets";

/**
 * Barre d'onglets du détail d'une saison.
 *
 * Volontairement des `<Link>` et non un composant Tabs interactif : l'onglet
 * vit dans l'URL, chaque panneau est rendu côté serveur, et cette barre
 * n'embarque donc aucun JavaScript. Le prix à payer est une navigation par
 * onglet — c'est justement ce qui évite de charger les onze domaines d'un coup.
 */
export async function SaisonTabsNav({
    saisonId,
    actif,
}: {
    saisonId: string;
    actif: OngletSaison;
}) {
    const t = await getServerTranslations();

    return (
        <div
            // Onze onglets ne tiennent pas sur un téléphone : la barre défile
            // horizontalement au lieu de passer à la ligne ou de déborder.
            className="-mx-3 overflow-x-auto border-b border-border px-3 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8"
        >
            <nav className="flex w-max min-w-full items-center gap-1" aria-label={t("finance.saisons.title")}>
                {ONGLETS_SAISON.map((onglet) => {
                    const estActif = onglet === actif;
                    return (
                        <Link
                            key={onglet}
                            href={
                                onglet === "apercu"
                                    ? ROUTES.SAISON(saisonId)
                                    : `${ROUTES.SAISON(saisonId)}?tab=${onglet}`
                            }
                            aria-current={estActif ? "page" : undefined}
                            className={cn(
                                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C17A2B]",
                                estActif
                                    ? "border-[#C17A2B] font-semibold text-[#3D1C00]"
                                    : "border-transparent text-gray-600 hover:border-[#C17A2B]/40 hover:text-[#3D1C00]"
                            )}
                        >
                            {t(`finance.saisons.detail.tabs.${CLE_LIBELLE_ONGLET[onglet]}`)}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
