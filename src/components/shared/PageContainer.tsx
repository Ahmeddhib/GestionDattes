/**
 * Enveloppe de page standard du dashboard : mêmes marges, padding et
 * espacement vertical sur toutes les pages (ex. Types de Caisses,
 * Agriculteurs, Livraisons). À utiliser comme conteneur racine du contenu
 * de chaque page, à la place d'un div ad-hoc.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="erp-page mx-auto w-full min-w-0 max-w-[1600px] flex-1 space-y-4 px-3 py-4 sm:space-y-6 sm:px-5 sm:py-6 lg:px-8 lg:py-8 2xl:max-w-[1760px]">
            {children}
        </div>
    );
}
