"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/shared/Button";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { googleSignInAction } from "@/actions/auth/google-signin.action";

const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

function GoogleIcon() {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z" />
        </svg>
    );
}

export function LoginForm({ googleEnabled, authError }: { googleEnabled: boolean; authError?: string }) {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState<string | null>(
        authError === "GoogleAccountNotLinked"
            ? "Ce compte Google n'est pas encore autorisé. Contactez un administrateur."
            : authError
                ? "La connexion Google a échoué. Veuillez réessayer."
                : null
    );
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError(null);

        // Préparer les credentials sans tenantId (on sélectionnera après)
        const credentials: Record<string, string> = {
            email: data.email,
            password: data.password,
        };

        const res = await signIn("credentials", {
            ...credentials,
            redirect: false,
        });

        setLoading(false);

        if (res?.error) {
            // Gérer les différents types d'erreurs
            let errorMessage = "Email ou mot de passe incorrect.";

            if (res.error === "ACCOUNT_DISABLED") {
                errorMessage = "Ce compte est désactivé. Contactez l'administrateur.";
            } else if (res.error === "MISSING_CREDENTIALS") {
                errorMessage = "Email et mot de passe requis.";
            } else if (res.error === "TENANT_ACCESS_DENIED") {
                errorMessage = "Vous n'avez pas accès à cette Wakala.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } else {
            setSuccess(true);
            toast.success("Connexion réussie!");
            // Toujours rediriger vers select-wakala après login
            router.push("/select-wakala");
            router.refresh();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            if (!googleEnabled) {
                                const message = t("auth.googleNotConfigured");
                                setError(message);
                                toast.info(message);
                                return;
                            }
                            setLoading(true);
                            setError(null);
                            void googleSignInAction().catch(() => {
                                setLoading(false);
                                const message = "La connexion Google a échoué. Veuillez réessayer.";
                                setError(message);
                                toast.error(message);
                            });
                        }}
                        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#dfccb3] bg-card px-4 text-sm font-semibold text-[#3d2a16] shadow-sm transition hover:border-[#c17a2b] hover:bg-[#fdfaf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c17a2b]/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#5b4027] dark:bg-[#211810] dark:text-[#f8f1e4] dark:hover:border-[#c17a2b] dark:hover:bg-[#2b1d10]"
                    >
                        <GoogleIcon />
                        {t("auth.continueGoogle")}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#e8d5b0] dark:bg-[#5b4027]" />
                        <span className="text-[11px] text-[#8a6c49] dark:text-[#aa9983]">{t("auth.orEmail")}</span>
                        <div className="h-px flex-1 bg-[#e8d5b0] dark:bg-[#5b4027]" />
                    </div>
            </>
            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5c3a1a] dark:text-[#ead8bc]">
                    {t("auth.email")}
                </label>
                <div className="relative">
                    <Mail
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a744b] dark:text-[#bda98d]"
                    />
                    <Input
                        type="email"
                        placeholder="admin@dattes.tn"
                        {...register("email")}
                        className="h-10 rounded-md border-[#dfccb3] bg-[#fdfaf5] pl-9 text-sm text-[#2c1a00] placeholder:text-[#a88b68] dark:border-[#5b4027] dark:bg-[#211810] dark:text-[#f8f1e4] dark:placeholder:text-[#806f5b]"
                    />
                </div>
                {errors.email && (
                    <p className="text-xs" style={{ color: "#8B1A1A" }}>
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5c3a1a] dark:text-[#ead8bc]">
                    {t("auth.password")}
                </label>
                <div className="relative">
                    <Lock
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a744b] dark:text-[#bda98d]"
                    />
                    <Input
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className="h-10 rounded-md border-[#dfccb3] bg-[#fdfaf5] pl-9 pr-10 text-sm text-[#2c1a00] placeholder:text-[#a88b68] dark:border-[#5b4027] dark:bg-[#211810] dark:text-[#f8f1e4] dark:placeholder:text-[#806f5b]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a744b] dark:text-[#bda98d]"
                    >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs" style={{ color: "#8B1A1A" }}>
                        {errors.password.message}
                    </p>
                )}
            </div>

            {/* Forgot */}
            <div className="text-right">
                <a href="#" className="text-xs hover:underline" style={{ color: "#C17A2B" }}>
                    {t("auth.forgotPassword")}
                </a>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-[10px] text-sm font-medium text-white gap-2"
                style={{ background: "#C17A2B" }}
            >
                <LogIn className="w-4 h-4" />
                {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </Button>

            {/* Feedback */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/35">
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#8B1A1A" }} />
                    <p className="text-xs text-red-800 dark:text-red-200">
                        {error}
                    </p>
                </div>
            )}
            {success && (
                <div
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ background: "#EBF2DC", border: "0.5px solid #C0D890" }}
                >
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#3D6010" }} />
                    <p className="text-xs" style={{ color: "#3D6010" }}>
                        Connexion réussie. Redirection…
                    </p>
                </div>
            )}

            {/* Divider + badges */}
            <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-[#e8d5b0] dark:bg-[#5b4027]" />
                <span className="text-[11px] text-[#8a6c49] dark:text-[#aa9983]">
                    Accès sécurisé
                </span>
                <div className="h-px flex-1 bg-[#e8d5b0] dark:bg-[#5b4027]" />
            </div>

            <div className="flex flex-col items-center justify-center gap-2 min-[380px]:flex-row min-[380px]:flex-wrap">
                {[
                    { icon: ShieldCheck, label: "SSL chiffré" },
                    { icon: Lock, label: "RBAC activé" },
                    { icon: CheckCircle, label: "Audit log" },
                ].map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 rounded-full border border-[#e8d5b0] bg-[#faf3e8] px-3 py-1.5 dark:border-[#5b4027] dark:bg-[#211810]"
                    >
                        <Icon className="w-3 h-3" style={{ color: "#8B4A0F" }} />
                        <span className="text-[11px] text-[#6f5232] dark:text-[#c5b49c]">
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </form>
    );
}
