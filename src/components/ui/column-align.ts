import type { RowData } from "@tanstack/react-table";

/**
 * Alignement d'une colonne, en-tête ET cellules.
 *
 * Sans cette convention, les deux étaient décidés à des endroits différents :
 * les cellules chiffrées portaient `text-right` dans leur `cell`, tandis que
 * l'en-tête restait aligné à gauche par défaut dans le composant de tableau. Le
 * libellé et sa valeur se retrouvaient donc aux deux extrémités de la même
 * colonne, et l'œil ne pouvait plus les rattacher — d'autant que les chiffres
 * sont larges (« 801800.00 ») et les libellés courts (« Montant »).
 *
 * Déclarer `meta: { align: "right" }` sur la colonne aligne désormais les deux
 * d'un seul geste : c'est la colonne qui porte son alignement, pas la cellule.
 */
export type ColumnAlign = "left" | "center" | "right";

declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: ColumnAlign;
    }
}

/** Classe d'alignement du texte, pour `<th>` comme pour `<td>`. */
export function classeAlignement(align: ColumnAlign | undefined) {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return undefined;
}

/**
 * L'en-tête triable est un bouton en `inline-flex` : il suit donc le
 * `text-align` du `<th>` qui le contient. En `flex` (bloc), il occupait toute
 * la largeur et l'alignement de la cellule n'avait plus aucun effet sur lui.
 */
export function classeBoutonTri(align: ColumnAlign | undefined) {
    if (align === "right") return "flex-row-reverse";
    return undefined;
}
