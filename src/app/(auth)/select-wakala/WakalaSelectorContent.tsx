"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronRight, Loader2, Plus } from "lucide-react";
import { selectWakalaAction } from "@/actions/auth/select-wakala.action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWakalaAction } from "@/actions/auth/create-wakala.action";
import { toast } from "sonner";

interface Tenant {
    id: string;
    name: string;
    code: string;
    role: {
        id: string;
        name: string;
    };
}

interface Props {
    tenants: Tenant[];
    user: {
        name: string;
        email: string;
    };
}

export default function WakalaSelectorContent({ tenants, user }: Props) {
    const router = useRouter();
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // État pour la création de wakala
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [wakalaName, setWakalaName] = useState("");
    const [wakalaCode, setWakalaCode] = useState("");

    const handleSelectWakala = async (tenantId: string) => {
        setSelectedTenantId(tenantId);
        setError(null);

        startTransition(async () => {
            try {
                const result = await selectWakalaAction(tenantId);

                if (result.error) {
                    setError(result.error);
                    toast.error(result.error);
                    setSelectedTenantId(null);
                } else if (result.success && result.tenant) {
                    sessionStorage.setItem("selectedWakalaId", result.tenant.id);
                    sessionStorage.setItem("selectedWakalaCode", result.tenant.code);
                    router.push("/dashboard");
                    router.refresh();
                }
            } catch (err) {
                setError("Une erreur est survenue");
                toast.error("Une erreur est survenue lors de la sélection");
                setSelectedTenantId(null);
            }
        });
    };

    const handleCreateWakala = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setIsCreating(true);

        try {
            const result = await createWakalaAction({ name: wakalaName, code: wakalaCode });

            if (result.error) {
                setCreateError(result.error);
                toast.error(result.error);
            } else if (result.success && result.tenantId) {
                toast.success("Wakala créée avec succès");
                // Fermer le dialog
                setIsCreateDialogOpen(false);
                // Réinitialiser les champs
                setWakalaName("");
                setWakalaCode("");
                // Recharger la page pour afficher la nouvelle wakala dans la liste
                router.refresh();
            }
        } catch (err) {
            setCreateError("Une erreur est survenue lors de la création");
            toast.error("Une erreur est survenue lors de la création");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C17A2B]/10 mb-4">
                        <Building2 className="w-8 h-8 text-[#C17A2B]" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Sélectionnez une Wakala
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenue <span className="font-semibold">{user.name}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Tenant List */}
                <div className="space-y-3">
                    {tenants.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-6">
                                Vous n'êtes associé à aucune Wakala pour le moment.
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Créez votre première Wakala pour commencer ou attendez qu'un administrateur vous invite.
                            </p>
                        </div>
                    ) : (
                        tenants.map((tenant) => (
                            <button
                                key={tenant.id}
                                onClick={() => handleSelectWakala(tenant.id)}
                                disabled={isPending}
                                className={`
                                    w-full flex items-center justify-between p-5 rounded-md
                                    border-2 transition-all duration-200
                                    ${selectedTenantId === tenant.id
                                        ? "border-[#C17A2B] bg-[#C17A2B]/5"
                                        : "border-gray-200 hover:border-[#C17A2B]/50 hover:bg-gray-50"
                                    }
                                    ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-[#C17A2B]/10 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-[#C17A2B]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-foreground text-lg">
                                            {tenant.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Code: <span className="font-mono">{tenant.code}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Rôle: {tenant.role.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {isPending && selectedTenantId === tenant.id ? (
                                        <Loader2 className="w-5 h-5 text-[#C17A2B] animate-spin" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>
                        ))
                    )}

                    {/* Create New Wakala Button */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                className="w-full flex items-center justify-center gap-3 p-5 rounded-md border-2 border-dashed border-gray-300 hover:border-[#C17A2B] hover:bg-gray-50 transition-all duration-200"
                                disabled={isPending}
                            >
                                <Plus className="w-5 h-5 text-[#C17A2B]" />
                                <span className="font-semibold text-foreground">
                                    Créer une nouvelle Wakala
                                </span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-card sm:max-w-106.25 rounded-lg">
                            <form onSubmit={handleCreateWakala}>
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">Créer une nouvelle Wakala</DialogTitle>
                                    <DialogDescription>
                                        Remplissez les informations pour créer votre Wakala. Vous serez automatiquement l'administrateur.
                                    </DialogDescription>
                                </DialogHeader>

                                {createError && (
                                    <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                        {createError}
                                    </div>
                                )}

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="wakalaName" className="text-foreground">
                                            Nom de la Wakala *
                                        </Label>
                                        <Input
                                            id="wakalaName"
                                            value={wakalaName}
                                            onChange={(e) => setWakalaName(e.target.value)}
                                            placeholder="Ex: Wakala Tunis Centre"
                                            required
                                            className="rounded-sm border-border"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="wakalaCode" className="text-foreground">
                                            Code de la Wakala *
                                        </Label>
                                        <Input
                                            id="wakalaCode"
                                            value={wakalaCode}
                                            onChange={(e) => setWakalaCode(e.target.value.toUpperCase())}
                                            placeholder="Ex: WKL001"
                                            required
                                            maxLength={20}
                                            className="rounded-sm border-border font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Code unique pour identifier votre Wakala
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                        disabled={isCreating}
                                        className="rounded-md"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isCreating || !wakalaName || !wakalaCode}
                                        className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Création...
                                            </>
                                        ) : (
                                            "Créer la Wakala"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Info Footer */}
                <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        Vous pouvez changer de Wakala à tout moment depuis le menu principal
                    </p>
                </div>
            </div>
        </div>
    );
}
