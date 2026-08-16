"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange, ArrowLeft, Lock, FileClock, Loader2 } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { genererBilanProvisoireAction } from "@/actions/saisons/generer-bilan-provisoire.action";

export interface SaisonEntete {
    id: string;
    nom: string;
    dateDebut: Date | string;
    dateFin: Date | string;
    statut: "OUVERTE" | "CLOTUREE";
    createdAt: Date | string;
    clotureeAt?: Date | string | null;
}

/**
 * En-tête du détail d'une saison : identité, statut et les deux actions.
 *
 * Extrait de l'aperçu pour rester visible quel que soit l'onglet actif — on
 * doit pouvoir figer un bilan provisoire sans revenir sur l'aperçu.
 */
export function SaisonDetailHeader({
    saison,
    canGenererProvisoire,
    canCloturer,
}: {
    saison: SaisonEntete;
    canGenererProvisoire: boolean;
    canCloturer: boolean;
}) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleGenererProvisoire() {
        startTransition(async () => {
            const result = await genererBilanProvisoireAction(saison.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(
                t("finance.saisons.provisoire.successToast", {
                    version: String(result.data?.version ?? ""),
                })
            );
            // `refresh` recharge la liste des bilans côté serveur ; l'aperçu est
            // remonté sur le nouvel identifiant et affiche donc la version qui
            // vient d'être générée.
            router.refresh();
        });
    }

    return (
        <>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link
                        href={ROUTES.SAISONS}
                        className="mb-2 flex items-center gap-1 text-sm text-[#C17A2B] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("finance.saisons.cloture.backToList")}
                    </Link>
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-[#3D1C00] sm:text-3xl">
                        <CalendarRange className="h-8 w-8 shrink-0 text-[#C17A2B]" />
                        {saison.nom}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                            variant={saison.statut === "OUVERTE" ? "default" : "secondary"}
                            className={saison.statut === "OUVERTE" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {saison.statut === "OUVERTE"
                                ? t("finance.saisons.ouverte")
                                : t("finance.saisons.cloturee")}
                        </Badge>
                        <span className="text-sm text-gray-600">
                            {format(new Date(saison.dateDebut), "dd MMM yyyy", { locale: fr })} —{" "}
                            {format(new Date(saison.dateFin), "dd MMM yyyy", { locale: fr })}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {saison.statut === "OUVERTE" && canGenererProvisoire && (
                        <Button
                            variant="outline"
                            onClick={handleGenererProvisoire}
                            disabled={isPending}
                            className="rounded-md border-[#C17A2B]/40 text-[#3D1C00]"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileClock className="mr-2 h-4 w-4 text-[#C17A2B]" />
                            )}
                            {t("finance.saisons.provisoire.action")}
                        </Button>
                    )}
                    {saison.statut === "OUVERTE" && canCloturer && (
                        <Link href={`${ROUTES.SAISON(saison.id)}/cloture`}>
                            <Button className="rounded-md bg-amber-700 text-white hover:bg-amber-800">
                                <Lock className="mr-2 h-4 w-4" />
                                {t("finance.saisons.cloture.action")}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Le malentendu que cette page doit lever : les deux boutons
                ci-dessus ne font pas du tout la même chose. */}
            {saison.statut === "OUVERTE" && (canGenererProvisoire || canCloturer) && (
                <p className="-mt-2 text-sm text-gray-600">
                    {t("finance.saisons.provisoire.vsCloture")}
                </p>
            )}
        </>
    );
}
