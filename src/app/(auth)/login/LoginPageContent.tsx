"use client";

import { useEffect, useRef } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import Image from "next/image";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LoginPageContent({
    googleEnabled,
    authError,
    loggedOut,
}: {
    googleEnabled: boolean;
    authError?: string;
    loggedOut?: boolean;
}) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const logoutToastShown = useRef(false);

    useEffect(() => {
        if (!loggedOut || logoutToastShown.current) return;
        logoutToastShown.current = true;
        toast.dismiss();
        toast.success(t("auth.loggedOut"), { id: "auth-logged-out" });
        router.replace("/login", { scroll: false });
    }, [loggedOut, router, t]);

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#f7efe1] p-4 text-[#2c1a00] transition-colors dark:bg-[#090705] dark:text-[#f8f1e4]">
            <div className="absolute end-4 top-4 z-20 flex items-center gap-2 sm:end-6 sm:top-6">
                <ThemeToggle premium />
                <LanguageSwitcher />
            </div>
            <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e7d7c2] bg-card shadow-[0_24px_70px_rgba(72,42,12,.14)] dark:border-[#5b4027]/55 dark:bg-[#17120d] dark:shadow-[0_26px_80px_rgba(0,0,0,.5)]">
                {/* ── Panneau gauche — Brand ── */}
                <div
                    className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[#4a2302] p-10 md:flex dark:bg-[#120c07]"
                >
                    {/* Texture woven */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px)",
                        }}
                    />

                    {/* Logo */}
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f7f3e9]">
                                <Image src="/kayen-logo.jpg" alt="Logo Kayen Fruits Packaging" fill sizes="56px" className="object-cover" priority />
                            </div>
                            <div>
                                <p className="text-base font-semibold" style={{ color: "#F5E6C8" }}>
                                    KAYEN
                                </p>
                                <p className="text-[10px] tracking-wide" style={{ color: "rgba(245,230,200,0.55)" }}>
                                    FRUITS PACKAGING · ERP
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
                            {
                                value: "20 000+",
                                label: "Agriculteurs enregistrés",
                                bg: "#C17A2B",
                            },
                            {
                                value: "100 000+",
                                label: "Livraisons traitées",
                                bg: "#8B4A0F",
                            },
                            {
                                value: "Analyses en temps réel",
                                label: "Qualité & traçabilité",
                                bg: "#5C7A8B",
                            },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="flex items-center gap-3 rounded-xl p-3"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "0.5px solid rgba(255,255,255,0.1)",
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
                                    <p
                                        className="text-[11px]"
                                        style={{ color: "rgba(245,230,200,0.45)" }}
                                    >
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
                <div className="flex flex-1 items-center justify-center bg-card p-5 pt-20 transition-colors dark:bg-[#17120d] sm:p-8 sm:pt-20 md:p-12">
                    <div className="w-full max-w-sm">
                        <div className="mb-6 flex justify-center md:hidden">
                            <Image src="/kayen-logo.jpg" alt="Kayen Fruits Packaging" width={136} height={136} className="h-28 w-28 rounded-xl object-cover" priority />
                        </div>
                        <div className="mb-8">
                            <h1 className="mb-1.5 text-2xl font-semibold text-[#2c1a00] dark:text-[#f8f1e4]">
                                {t("auth.login")}
                            </h1>
                            <p className="text-sm text-[#8a6c49] dark:text-[#aa9983]">
                                {t("auth.welcomeBack")}
                            </p>
                        </div>
                        <LoginForm googleEnabled={googleEnabled} authError={authError} />
                    </div>
                </div>
            </div>
        </div>
    );
}
