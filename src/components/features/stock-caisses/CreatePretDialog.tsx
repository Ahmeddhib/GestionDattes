"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createPretAction } from "@/actions/prets-caisses/create-pret.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { getLivreursAction } from "@/actions/livreurs/get-livreurs.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { SaisonActiveField, type SaisonActive } from "@/components/features/saisons/SaisonActiveField";

const AUCUN_LIVREUR = "none";

export function CreatePretDialog({ saisonActive }: { saisonActive?: SaisonActive }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agriculteurs, setAgriculteurs] = useState<any[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<any[]>([]);
    const [livreurs, setLivreurs] = useState<any[]>([]);
    const [stockMax, setStockMax] = useState(0);

    // Schéma de validation dynamique
    const formSchema = z.object({
        agriculteurId: z.string().min(1, t("validation.required")),
        typeCaisseId: z.string().min(1, t("validation.required")),
        nombrePrete: z.preprocess(
            (val) => (val === "" || val === undefined ? undefined : Number(val)),
            z.number({ message: t("validation.integer") })
                .int(t("validation.integer"))
                .min(1, t("validation.minValue").replace("{min}", "1"))
                .max(
                    stockMax > 0 ? stockMax : 999999,
                    stockMax > 0
                        ? `${t("pretsCaisses.stockInsuffisant")} (Max: ${stockMax})`
                        : t("validation.required")
                )
        ),
        observations: z.string().optional(),
        livreurId: z.string().optional(),
    });

    type FormData = {
        agriculteurId: string;
        typeCaisseId: string;
        nombrePrete: number;
        observations?: string;
        livreurId?: string;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            agriculteurId: "",
            typeCaisseId: "",
            nombrePrete: undefined as any,
            observations: "",
            livreurId: AUCUN_LIVREUR,
        },
    });

    useEffect(() => {
        if (open) loadData();
    }, [open]);

    // Mettre à jour le stock max quand le type de caisse change
    const watchTypeCaisse = form.watch("typeCaisseId");
    useEffect(() => {
        if (watchTypeCaisse) {
            const type = typesCaisses.find(t => t.id === watchTypeCaisse);
            const newStockMax = type?.stockDisponible || 0;
            setStockMax(newStockMax);

            // Revalider le champ nombrePrete si nécessaire
            const currentValue = form.getValues("nombrePrete");
            if (currentValue && currentValue > newStockMax) {
                form.trigger("nombrePrete");
            }
        }
    }, [watchTypeCaisse, typesCaisses, form]);

    async function loadData() {
        const [agriResult, caissesResult, livreursResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesCaissesAction(),
            getLivreursAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
        if (livreursResult.success) setLivreurs((livreursResult.data || []).filter((l: any) => l.active));
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        // Créer un FormData pour l'action serveur
        const formData = new FormData();
        formData.append("agriculteurId", data.agriculteurId);
        formData.append("typeCaisseId", data.typeCaisseId);
        formData.append("nombrePrete", data.nombrePrete.toString());
        if (data.observations) {
            formData.append("observations", data.observations);
        }
        if (data.livreurId && data.livreurId !== AUCUN_LIVREUR) {
            formData.append("livreurId", data.livreurId);
        }

        const result = await createPretAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("pretsCaisses.nouveauPret")));
            setOpen(false);
            form.reset();
            setStockMax(0);
            // Rafraîchir les données de la page sans recharger tout le navigateur
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset();
            setStockMax(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("pretsCaisses.nouveauPret")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-125 bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {t("pretsCaisses.preterCaisses")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("pretsCaisses.nouveauPretDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {saisonActive && <SaisonActiveField saison={saisonActive} />}

                        {/* Agriculteur */}
                        <FormField
                            control={form.control}
                            name="agriculteurId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.agriculteur")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectAgriculteur")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            {agriculteurs.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Type Caisse */}
                        <FormField
                            control={form.control}
                            name="typeCaisseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.typeCaisse")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectTypeCaisse")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            {typesCaisses.map((tc) => (
                                                <SelectItem key={tc.id} value={tc.id}>
                                                    {tc.nom} ({tc.poidsKg} kg) - Stock: {tc.stockDisponible || 0}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Livreur (facultatif) */}
                        <FormField
                            control={form.control}
                            name="livreurId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.livreur")}
                                        <span className="text-muted-foreground ml-1 font-normal">
                                            ({t("common.optional")})
                                        </span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || AUCUN_LIVREUR}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectLivreur")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            <SelectItem value={AUCUN_LIVREUR}>
                                                {t("pretsCaisses.remiseParAgriculteur")}
                                            </SelectItem>
                                            {livreurs.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Nombre */}
                        <FormField
                            control={form.control}
                            name="nombrePrete"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.nombrePrete")}
                                        {stockMax > 0 && (
                                            <span className="text-orange-600 ml-1">(Max: {stockMax})</span>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder={t("pretsCaisses.nombrePreterPlaceholder")}
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                    {stockMax === 0 && field.value && (
                                        <p className="text-xs text-red-600">
                                            {t("pretsCaisses.stockInsuffisantMessage")}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Observations */}
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.observations")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("pretsCaisses.notesOptionnelles")}
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="rounded-md"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || stockMax === 0}
                                className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                {loading ? t("pretsCaisses.preting") : t("common.create")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
