"use client";

import { useState, useTransition } from "react";
import { Building2, ChevronRight, Loader2 } from "lucide-react";
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

    const handleSelectWakala = async (tenantId: string) => {
        setSelectedTenantId(tenantId);
        setError(null);

        startTransition(async () => {
            try {
                const result = await selectWakalaAction(tenantId);

                if (result.error) {
                    setError(result.error);
                    setSelectedTenantId(null);
                } else {
                    // Redirection vers le dashboard
                    router.push("/dashboard");
                    router.refresh();
                }
            } catch (err) {
                setError("Une erreur est survenue");
                setSelectedTenantId(null);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF0DC] p-4">
            <div className="bg-white rounded-[14px] shadow-xl max-w-2xl w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C17A2B]/10 mb-4">
                        <Building2 className="w-8 h-8 text-[#C17A2B]" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Sélectionnez une Wakala
                    </h1>
                    <p className="text-gray-600">
                        Bienvenue <span className="font-semibold">{user.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[9px] text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Tenant List */}
                <div className="space-y-3">
                    {tenants.map((tenant) => (
                        <button
                            key={tenant.id}
                            onClick={() => handleSelectWakala(tenant.id)}
                            disabled={isPending}
                            className={`
                                w-full flex items-center justify-between p-5 rounded-[9px] 
                                border-2 transition-all duration-200
                                ${selectedTenantId === tenant.id
                                    ? "border-[#C17A2B] bg-[#C17A2B]/5"
                                    : "border-gray-200 hover:border-[#C17A2B]/50 hover:bg-gray-50"
                                }
                                ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[9px] bg-[#C17A2B]/10 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-[#C17A2B]" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        {tenant.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Code: <span className="font-mono">{tenant.code}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
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
                    ))}
                </div>

                {/* Info Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Vous pouvez changer de Wakala à tout moment depuis le menu principal
                    </p>
                </div>
            </div>
        </div>
    );
}
