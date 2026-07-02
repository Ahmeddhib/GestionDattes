"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectWakalaAction } from "@/actions/auth/select-wakala.action";
import { useRouter } from "next/navigation";

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
    currentTenant: {
        id: string;
        name: string;
        code: string;
    } | null;
    availableTenants: Tenant[];
}

export default function WakalaSwitcher({ currentTenant, availableTenants }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSwitchWakala = async (tenantId: string) => {
        if (tenantId === currentTenant?.id) return;

        setError(null);

        startTransition(async () => {
            try {
                const result = await selectWakalaAction(tenantId);

                if (result.error) {
                    setError(result.error);
                } else {
                    // Recharger la page pour mettre à jour toutes les données
                    router.push("/dashboard");
                    router.refresh();
                }
            } catch (err) {
                setError("Erreur lors du changement de Wakala");
            }
        });
    };

    if (!currentTenant) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-[9px] hover:bg-gray-100 transition-colors"
                    disabled={isPending}
                >
                    <Building2 className="w-4 h-4 text-[#C17A2B]" />
                    <div className="text-left">
                        <div className="text-sm font-semibold text-gray-900">
                            {currentTenant.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                            {currentTenant.code}
                        </div>
                    </div>
                    {isPending ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Changer de Wakala</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {error && (
                    <div className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded mx-2 mb-2">
                        {error}
                    </div>
                )}

                {availableTenants.map((tenant) => (
                    <DropdownMenuItem
                        key={tenant.id}
                        onClick={() => handleSwitchWakala(tenant.id)}
                        disabled={isPending || tenant.id === currentTenant.id}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#C17A2B]" />
                                <div>
                                    <div className="text-sm font-medium">{tenant.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {tenant.code}
                                    </div>
                                </div>
                            </div>
                            {tenant.id === currentTenant.id && (
                                <Check className="w-4 h-4 text-[#C17A2B]" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
