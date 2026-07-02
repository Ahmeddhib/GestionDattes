"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, ArrowRight, MapPin, Phone, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import CreateWakalaDialog from "@/components/features/tenants/CreateWakalaDialog";

interface Wakala {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    createdAt: Date;
}

interface Props {
    wakalas: Wakala[];
}

export default function WakalaSelectionPage({ wakalas }: Props) {
    const router = useRouter();
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // Nettoyer le sessionStorage au chargement de la page
    // (utilisateur vient de se déconnecter ou arrive pour la première fois)
    useEffect(() => {
        sessionStorage.removeItem("selectedWakalaId");
        sessionStorage.removeItem("selectedWakalaCode");
    }, []);

    const handleSelectWakala = (wakalaId: string, wakalaCode: string) => {
        // Stocker la Wakala sélectionnée dans sessionStorage
        sessionStorage.setItem("selectedWakalaId", wakalaId);
        sessionStorage.setItem("selectedWakalaCode", wakalaCode);

        // Rediriger vers le login
        router.push("/login");
    };

    const handleWakalaCreated = () => {
        setShowCreateDialog(false);
        // Rafraîchir la page pour afficher la nouvelle Wakala
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF0DC] via-[#F5E6C8] to-[#FAF0DC]">
            {/* Header */}
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#C17A2B] mb-6 shadow-lg">
                        <span className="text-4xl">🌴</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-[#2C1A00] mb-4">
                        Gestion Dattes
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Plateforme ERP Multi-Wakala
                    </p>
                    <p className="text-sm text-gray-500">
                        Sélectionnez une Wakala pour vous connecter
                    </p>
                </div>

                {/* Wakalas Grid */}
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Bouton Créer Nouvelle Wakala */}
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="group relative bg-white rounded-[14px] border-2 border-dashed border-[#C17A2B]/30 hover:border-[#C17A2B] hover:bg-[#C17A2B]/5 transition-all duration-300 p-8 flex flex-col items-center justify-center min-h-[280px] cursor-pointer"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#C17A2B]/10 group-hover:bg-[#C17A2B]/20 flex items-center justify-center mb-4 transition-colors">
                                <Plus className="w-8 h-8 text-[#C17A2B]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#2C1A00] mb-2">
                                Créer Nouvelle Wakala
                            </h3>
                            <p className="text-sm text-gray-500 text-center">
                                Ajoutez un nouvel espace de travail
                            </p>
                        </button>

                        {/* Cards des Wakalas Existantes */}
                        {wakalas.map((wakala) => (
                            <button
                                key={wakala.id}
                                onClick={() => handleSelectWakala(wakala.id, wakala.code)}
                                className="group relative bg-white rounded-[14px] border-2 border-gray-200 hover:border-[#C17A2B] hover:shadow-xl transition-all duration-300 p-8 text-left overflow-hidden"
                            >
                                {/* Badge Code */}
                                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#C17A2B]/10 border border-[#C17A2B]/20">
                                    <span className="text-xs font-mono font-semibold text-[#C17A2B]">
                                        {wakala.code}
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-[#C17A2B]/10 group-hover:bg-[#C17A2B]/20 flex items-center justify-center mb-4 transition-colors">
                                    <Building2 className="w-7 h-7 text-[#C17A2B]" />
                                </div>

                                {/* Nom */}
                                <h3 className="text-xl font-bold text-[#2C1A00] mb-4 pr-20">
                                    {wakala.name}
                                </h3>

                                {/* Détails */}
                                <div className="space-y-2 mb-6">
                                    {wakala.address && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="line-clamp-1">{wakala.address}</span>
                                        </div>
                                    )}
                                    {wakala.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{wakala.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span>
                                            Créée le {new Date(wakala.createdAt).toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                </div>

                                {/* Bouton Action */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-sm font-medium text-[#C17A2B] group-hover:text-[#8B4A0F]">
                                        Se connecter
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-[#C17A2B] group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Message si aucune Wakala */}
                    {wakalas.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Building2 className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Aucune Wakala disponible
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Créez votre première Wakala pour commencer
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        © 2026 Gestion Dattes — Tunisie
                    </p>
                </div>
            </div>

            {/* Dialog Création Wakala */}
            <CreateWakalaDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleWakalaCreated}
            />
        </div>
    );
}
