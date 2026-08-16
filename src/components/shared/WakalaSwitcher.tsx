"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectWakalaAction } from "@/actions/auth/select-wakala.action";

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
                    toast.error(result.error);
                } else if (result.success && result.tenant) {
                    // Stocker dans sessionStorage
                    sessionStorage.setItem("selectedWakalaId", result.tenant.id);
                    sessionStorage.setItem("selectedWakalaCode", result.tenant.code);
                    toast.success(`Wakala changée: ${result.tenant.name}`);
                    window.location.href = "/dashboard";
                }
            } catch {
                const errorMsg = "Erreur lors du changement de Wakala";
                setError(errorMsg);
                toast.error(errorMsg);
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
                    className="flex min-h-11 items-center gap-2 rounded-[9px] border border-gray-200 bg-white px-2 py-2 shadow-sm transition-colors hover:bg-gray-50 sm:px-3"
                    disabled={isPending}
                >
                    <Building2 className="w-4 h-4 text-[#C17A2B]" />
                    <div className="hidden min-w-0 text-start sm:block">
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
                        <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[min(18rem,calc(100vw-1rem))] rounded-[14px] border border-gray-200 bg-white shadow-lg">
                <DropdownMenuLabel className="text-base font-semibold text-[#3D1C00] px-4 py-3">
                    Changer de Wakala
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />

                {error && (
                    <div className="px-4 py-2 mx-2 my-2 text-sm text-red-600 bg-red-50 rounded-[9px] border border-red-200">
                        {error}
                    </div>
                )}

                <div className="py-2">
                    {availableTenants.map((tenant) => (
                        <DropdownMenuItem
                            key={tenant.id}
                            onClick={() => handleSwitchWakala(tenant.id)}
                            disabled={isPending || tenant.id === currentTenant.id}
                            className="mx-2 px-3 py-3 cursor-pointer rounded-[9px] hover:bg-[#FAF0DC] focus:bg-[#FAF0DC] transition-colors"
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-[9px] bg-[#C17A2B]/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-[#C17A2B]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {tenant.name}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                            {tenant.code}
                                        </div>
                                    </div>
                                </div>
                                {tenant.id === currentTenant.id && (
                                    <Check className="w-5 h-5 text-[#C17A2B]" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
