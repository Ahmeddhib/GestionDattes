"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CalendarRange } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SaisonOption {
    id: string;
    nom: string;
    statut: "OUVERTE" | "CLOTUREE";
}

interface SaisonFilterSelectProps {
    saisons: SaisonOption[];
    /** Valeur courante résolue côté serveur : "courante" | "precedente" | "toutes" | <id>. */
    value: string;
}

/**
 * Filtre saison partagé par toutes les pages de liste. L'état vit dans l'URL
 * (et non en state local) : le rafraîchissement, les boutons Précédent/Suivant
 * du navigateur et le partage de lien fonctionnent sans code supplémentaire.
 */
export function SaisonFilterSelect({ saisons, value }: SaisonFilterSelectProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    function handleChange(next: string) {
        const params = new URLSearchParams(searchParams.toString());

        if (next === "courante") {
            // La saison courante est le défaut : on garde l'URL propre.
            params.delete("saisonId");
        } else {
            params.set("saisonId", next);
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    }

    return (
        <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-[#C17A2B]" />
            <Select value={value} onValueChange={handleChange} disabled={isPending}>
                <SelectTrigger className="h-10 w-[min(220px,calc(100vw-4rem))] rounded-xl border-border bg-background/85">
                    <SelectValue placeholder={t("finance.saisons.filtre.label")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="courante">{t("finance.saisons.filtre.courante")}</SelectItem>
                    <SelectItem value="precedente">{t("finance.saisons.filtre.precedente")}</SelectItem>
                    <SelectItem value="toutes">{t("finance.saisons.filtre.toutes")}</SelectItem>
                    {saisons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.nom}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
