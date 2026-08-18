"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { updateVenteAction } from "@/actions/ventes/update-vente.action";
import type { Vente } from "./columns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

const formSchema = z.object({
    clientId: z.string().min(1, "validation.required"),
    quantite: z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number({ message: "validation.required" }).positive("validation.positive")
    ),
    prixUnitaire: z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number({ message: "validation.required" }).positive("validation.positive")
    ),
});

type FormData = z.infer<typeof formSchema>;

interface EditVenteDialogProps {
    vente: Vente | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditVenteDialog({ vente, open, onOpenChange }: EditVenteDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            clientId: "",
            quantite: undefined as any,
            prixUnitaire: undefined as any,
        },
    });

    useEffect(() => {
        if (open) {
            getClientsAction().then((clientsResult) => {
                if (clientsResult.success) setClients(clientsResult.data || []);
            });
        }
    }, [open]);

    useEffect(() => {
        if (vente && open) {
            form.reset({
                clientId: vente.Client.id,
                quantite: vente.quantite,
                prixUnitaire: vente.prixUnitaire,
            });
        }
    }, [vente, open, form]);

    const watchQuantite = form.watch("quantite");
    const watchPrixUnitaire = form.watch("prixUnitaire");
    const montantTotal = (watchQuantite || 0) * (watchPrixUnitaire || 0);

    async function onSubmit(data: FormData) {
        if (!vente) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("id", vente.id);
        formData.append("clientId", data.clientId);
        formData.append("quantite", data.quantite.toString());
        formData.append("prixUnitaire", data.prixUnitaire.toString());

        const result = await updateVenteAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.updated", { entity: t("finance.ventes.title") }));
            onOpenChange(false);
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    if (!vente) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-lg sm:max-w-125 bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{t("finance.ventes.modifierVente")}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {vente.StockDate.TypeDate.nom} — Lot {vente.StockDate.Livraison.numeroLot}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">{t("finance.ventes.client")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("finance.ventes.client")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="quantite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground">
                                            {t("finance.ventes.quantite")}
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
                                name="prixUnitaire"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground">
                                            {t("finance.ventes.prixUnitaire")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.001"
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
                        </div>

                        <div className="rounded-md bg-muted p-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                                {t("finance.ventes.montantTotal")}
                            </span>
                            <span className="text-lg font-bold text-[#C17A2B]">{montantTotal.toFixed(2)}</span>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="rounded-md"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("common.update")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
