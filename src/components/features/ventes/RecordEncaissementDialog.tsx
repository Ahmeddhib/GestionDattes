"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { createEncaissementAction } from "@/actions/encaissements-clients/create-encaissement.action";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";

import { SaisonActiveField, type SaisonActive } from "@/components/features/saisons/SaisonActiveField";

interface RecordEncaissementDialogProps {
    venteId: string;
    clientNom: string;
    montantRestant: number;
    /**
     * Saison OUVERTE — celle où l'argent circule, et non celle de la vente
     * réglée. L'afficher rend visible une règle qui surprend sinon : un
     * encaissement d'une vente de la campagne précédente est rattaché à la
     * campagne en cours.
     */
    saisonActive?: SaisonActive;
}

export function RecordEncaissementDialog({
    venteId,
    clientNom,
    montantRestant,
    saisonActive,
}: RecordEncaissementDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const formSchema = z.object({
        montant: z.preprocess(
            (val) => (val === "" || val === undefined ? undefined : Number(val)),
            z
                .number({ message: t("validation.required") })
                .positive(t("validation.positive"))
                .max(
                    montantRestant > 0 ? montantRestant : 999999999,
                    `${t("finance.paiements.montantRestant")}: ${montantRestant.toFixed(2)}`
                )
        ),
        modePaiement: z.string().optional(),
        observations: z.string().optional(),
    });

    type FormData = { montant: number; modePaiement?: string; observations?: string };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: { montant: undefined as any, modePaiement: "", observations: "" },
    });

    async function onSubmit(data: FormData) {
        setLoading(true);

        const formData = new FormData();
        formData.append("venteId", venteId);
        formData.append("montant", data.montant.toString());
        if (data.modePaiement) formData.append("modePaiement", data.modePaiement);
        if (data.observations) formData.append("observations", data.observations);

        const result = await createEncaissementAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("finance.ventes.encaissementEnregistre"));
            setOpen(false);
            form.reset();
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-sm border-border text-foreground hover:bg-muted"
                >
                    <Wallet className="h-3.5 w-3.5 text-[#C17A2B]" />
                    {t("finance.ventes.enregistrerEncaissement")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-125 bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {t("finance.ventes.nouvelEncaissement")} — {clientNom}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("finance.paiements.montantRestant")}: {montantRestant.toFixed(2)}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {saisonActive && <SaisonActiveField saison={saisonActive} />}

                        <FormField
                            control={form.control}
                            name="montant"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("finance.paiements.montant")}
                                        <span className="text-orange-600 ml-1">
                                            (Max: {montantRestant.toFixed(2)})
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(e.target.value ? Number(e.target.value) : undefined)
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="modePaiement"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("finance.paiements.modePaiement")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Espèces, Chèque, Virement..."
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("bonAchat.observations")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
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
                                disabled={loading || montantRestant === 0}
                                className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                {loading ? t("finance.paiements.enregistrement") : t("common.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
