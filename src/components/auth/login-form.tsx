"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/shared/Button";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";

const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "#5C3A1A" }}>
                    {t("auth.email")}
                </label>
                <div className="relative">
                    <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "#B08A5E" }}
                    />
                    <Input
                        type="email"
                        placeholder="admin@dattes.tn"
                        {...register("email")}
                        className="pl-9 h-10 rounded-[9px] text-sm"
                        style={{ borderColor: "#E8D5B0", background: "#FDFAF5" }}
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
                <label className="text-xs font-medium" style={{ color: "#5C3A1A" }}>
                    {t("auth.password")}
                </label>
                <div className="relative">
                    <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "#B08A5E" }}
                    />
                    <Input
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className="pl-9 pr-10 h-10 rounded-[9px] text-sm"
                        style={{ borderColor: "#E8D5B0", background: "#FDFAF5" }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "#B08A5E" }}
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
                <div
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ background: "#FDE8E8", border: "0.5px solid #F0C0C0" }}
                >
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#8B1A1A" }} />
                    <p className="text-xs" style={{ color: "#8B1A1A" }}>
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
                <div className="flex-1 h-px" style={{ background: "#E8D5B0" }} />
                <span className="text-[11px]" style={{ color: "#B08A5E" }}>
                    Accès sécurisé
                </span>
                <div className="flex-1 h-px" style={{ background: "#E8D5B0" }} />
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
                {[
                    { icon: ShieldCheck, label: "SSL chiffré" },
                    { icon: Lock, label: "RBAC activé" },
                    { icon: CheckCircle, label: "Audit log" },
                ].map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: "#FAF3E8", border: "0.5px solid #E8D5B0" }}
                    >
                        <Icon className="w-3 h-3" style={{ color: "#8B4A0F" }} />
                        <span className="text-[11px]" style={{ color: "#7A5C3A" }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </form>
    );
}
