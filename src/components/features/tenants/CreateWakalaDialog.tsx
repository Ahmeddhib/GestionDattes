"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/shared/Button";
import { createWakalaAction } from "@/actions/tenants/create-wakala.action";

const wakalaSchema = z.object({
    name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
    code: z
        .string()
        .min(2, "Le code doit contenir au moins 2 caractères")
        .max(10, "Le code ne peut pas dépasser 10 caractères")
        .regex(/^[A-Z0-9_-]+$/, "Le code doit être en majuscules (A-Z, 0-9, _, -)"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
});

type WakalaFormData = z.infer<typeof wakalaSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CreateWakalaDialog({ open, onOpenChange, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<WakalaFormData>({
        resolver: zodResolver(wakalaSchema),
    });

    const onSubmit = async (data: WakalaFormData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await createWakalaAction(data);

            if (result.error) {
                setError(result.error);
            } else {
                reset();
                onSuccess();
            }
        } catch (err) {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#C17A2B]/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#C17A2B]" />
                        </div>
                        <DialogTitle className="text-2xl">Créer une Nouvelle Wakala</DialogTitle>
                    </div>
                    <DialogDescription>
                        Créez un nouvel espace de travail. Un compte administrateur sera créé automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {/* Nom */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la Wakala *</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Wakala Tunis Nord"
                            {...register("name")}
                            className="rounded-[9px]"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">Code (Identifiant unique) *</Label>
                        <Input
                            id="code"
                            placeholder="Ex: TUN-NORD"
                            {...register("code")}
                            className="rounded-[9px] font-mono uppercase"
                            style={{ textTransform: "uppercase" }}
                        />
                        <p className="text-xs text-gray-500">
                            Utilisez uniquement des lettres majuscules, chiffres, tirets et underscores
                        </p>
                        {errors.code && (
                            <p className="text-sm text-red-600">{errors.code.message}</p>
                        )}
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse (optionnel)</Label>
                        <Textarea
                            id="address"
                            placeholder="Adresse complète de la Wakala"
                            {...register("address")}
                            className="rounded-[9px] resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone (optionnel)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="Ex: +216 XX XXX XXX"
                            {...register("phone")}
                            className="rounded-[9px]"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (optionnel)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="contact@wakala.tn"
                            {...register("email")}
                            className="rounded-[9px]"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-[9px] text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#C17A2B] hover:bg-[#8B4A0F]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Créer la Wakala
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
