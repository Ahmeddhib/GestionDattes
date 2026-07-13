"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPeseeSchema, type CreatePeseeInput } from "@/validators/pesee.validator";
import { createPeseeAction } from "@/actions/pesees/create-pesee.action";
import { getLivraisonsAction } from "@/actions/livraisons/get-livraisons.action";
import { toast } from "sonner";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Scale } from "lucide-react";

type Livraison = {
    id: string;
    numeroLot: string;
    Agriculteur: {
        nom: string;
        prenom: string;
    };
    TypeDate: {
        nom: string;
    };
};

export function CreatePeseeDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [livraisons, setLivraisons] = useState<any[]>([]);
    const [loadingLivraisons, setLoadingLivraisons] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<CreatePeseeInput>({
        resolver: zodResolver(createPeseeSchema),
        defaultValues: {
            livraisonId: "",
            poidsBrut: 0,
            tare: 0,
        },
    });

    const poidsBrut = form.watch("poidsBrut");
    const tare = form.watch("tare");
    const poidsNet = poidsBrut - (tare || 0);

    // Charger les livraisons quand le dialog s'ouvre
    useEffect(() => {
        if (open) {
            loadLivraisons();
        }
    }, [open]);

    const loadLivraisons = async () => {
        try {
            setLoadingLivraisons(true);
            const result = await getLivraisonsAction();
            if (result.success && result.data) {
                // Filtrer les livraisons qui n'ont pas encore de pesée
                const livraisonsSansPesee = result.data.filter(
                    (liv: any) => !liv.Pesee
                );
                setLivraisons(livraisonsSansPesee);
            }
        } catch (error) {
            console.error("Erreur chargement livraisons:", error);
            toast.error(t("messages.error.loadData"));
        } finally {
            setLoadingLivraisons(false);
        }
    };

    const onSubmit = async (data: CreatePeseeInput) => {
        try {
            setIsLoading(true);

            const result = await createPeseeAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.created", { entity: t("pesees.title") }));
            form.reset();
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("pesees.addNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-white rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {t("pesees.addNew")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("pesees.addNewDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="livraisonId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("pesees.selectLivraison")} *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoading || loadingLivraisons}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="rounded-[7px]">
                                                <SelectValue
                                                    placeholder={
                                                        loadingLivraisons
                                                            ? t("common.loading")
                                                            : t("pesees.selectLivraisonPlaceholder")
                                                    }
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {livraisons.length === 0 ? (
                                                <div className="p-2 text-sm text-gray-500">
                                                    {t("pesees.noLivraisonsAvailable")}
                                                </div>
                                            ) : (
                                                livraisons.map((livraison) => (
                                                    <SelectItem key={livraison.id} value={livraison.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {livraison.numeroLot}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {livraison.agriculteur?.nom} {livraison.agriculteur?.prenom} - {livraison.typeDate?.nom}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="poidsBrut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("pesees.poidsBrut")} (kg) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                placeholder="500.00"
                                                className="rounded-[7px]"
                                                disabled={isLoading}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tare"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("pesees.tare")} (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                placeholder="50.00"
                                                className="rounded-[7px]"
                                                disabled={isLoading}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Affichage du poids net calculé */}
                        <div className="rounded-[7px] bg-[#FAF0DC] border border-[#C17A2B] p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3D1C00]">
                                    {t("pesees.poidsNet")} :
                                </span>
                                <span className="text-2xl font-bold text-[#C17A2B]">
                                    {poidsNet.toFixed(2)} kg
                                </span>
                            </div>
                            {poidsNet <= 0 && poidsBrut > 0 && (
                                <p className="text-xs text-red-600 mt-2">
                                    ⚠️ {t("pesees.poidsNetMustBePositive")}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                                className="rounded-[9px]"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || poidsNet <= 0}
                                className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("common.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
