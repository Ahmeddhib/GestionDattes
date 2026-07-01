"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function LoginPageContent() {
    const { t } = useClientTranslations();

    return (
        <div className="min-h-screen bg-[#FAF0DC] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-xl">
                {/* ── Panneau gauche — Brand ── */}
                <div
                    className="hidden md:flex w-[42%] flex-col justify-between p-10 relative overflow-hidden"
                    style={{ background: "#3D1C00" }}
                >
                    {/* Texture woven */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px)"
                        }}
                    />

                    {/* Logo */}
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-10">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: "#C17A2B" }}
                            >
                                🌴
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: "#F5E6C8" }}>
                                    Gestion Dattes
                                </p>
                                <p className="text-[10px]" style={{ color: "rgba(245,230,200,0.45)" }}>
                                    Plateforme ERP
                                </p>
                            </div>
                        </div>

                        <p
                            className="text-xl font-medium leading-relaxed mb-3"
                            style={{ color: "#F5E6C8" }}
                        >
                            Gérez toute la filière dattes depuis un seul endroit.
                        </p>
                        <p className="text-sm" style={{ color: "rgba(245,230,200,0.5)" }}>
                            Agriculteurs · Livraisons · Analyses · Stocks · Rapports
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="relative flex flex-col gap-3">
                        {[
                            { value: "20 000+", label: "Agriculteurs enregistrés", bg: "#C17A2B" },
                            { value: "100 000+", label: "Livraisons traitées", bg: "#8B4A0F" },
                            { value: "Analyses en temps réel", label: "Qualité & traçabilité", bg: "#5C7A8B" },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="flex items-center gap-3 rounded-xl p-3"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "0.5px solid rgba(255,255,255,0.1)"
                                }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm"
                                    style={{ background: s.bg }}
                                >
                                    📊
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: "#F5E6C8" }}>
                                        {s.value}
                                    </p>
                                    <p className="text-[11px]" style={{ color: "rgba(245,230,200,0.45)" }}>
                                        {s.label}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div
                        className="relative pt-6"
                        style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
                    >
                        <p className="text-[11px]" style={{ color: "rgba(245,230,200,0.3)" }}>
                            © 2026 Gestion Dattes — Tunisie
                        </p>
                    </div>
                </div>

                {/* ── Panneau droit — Formulaire ── */}
                <div className="flex-1 bg-white flex items-center justify-center p-10 md:p-12">
                    <div className="w-full max-w-sm">
                        <div className="mb-8">
                            <h1 className="text-2xl font-medium mb-1.5" style={{ color: "#2C1A00" }}>
                                {t("auth.login")}
                            </h1>
                            <p className="text-sm" style={{ color: "#B08A5E" }}>
                                {t("auth.welcomeBack")}
                            </p>
                        </div>
                        <LoginForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
