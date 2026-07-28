/**
 * Enveloppe de page standard du dashboard : mêmes marges, padding et
 * espacement vertical sur toutes les pages (ex. Types de Caisses,
 * Agriculteurs, Livraisons). À utiliser comme conteneur racine du contenu
 * de chaque page, à la place d'un div ad-hoc.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
    return <div className="flex-1 space-y-6 p-8">{children}</div>;
}
