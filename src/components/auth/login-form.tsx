"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/validators/user.schema";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(LoginSchema),
    });

    async function onSubmit(data: LoginInput) {
        setLoading(true);
        setError(null);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });
            if (result?.error) {
                switch (result.error) {
                    case "ACCOUNT_DISABLED":
                        setError("Votre compte a été désactivé. Veuillez contacter l'administrateur.");
                        break;
                    case "INVALID_CREDENTIALS":
                        setError("Email ou mot de passe incorrect.");
                        break;
                    case "MISSING_CREDENTIALS":
                        setError("Veuillez remplir tous les champs.");
                        break;
                    default:
                        setError("Erreur de connexion. Veuillez réessayer.");
                }
            } else {
                router.push(ROUTES.DASHBOARD);
                router.refresh();
            }
        } catch {
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 shadow-2xl border-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        {/* Header */}
                        <div className="flex flex-col items-center gap-2 text-center mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-2">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold">Gestion des Dattes</h1>
                            <p className="text-sm text-muted-foreground">
                                Connectez-vous à votre espace
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Fields */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Adresse email</Label>
                                <Input
                                    {...register("email")}
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="admin@dattes.tn"
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mot de passe</Label>
                                </div>
                                <Input
                                    {...register("password")}
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={errors.password ? "border-destructive" : ""}
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 border-0"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Connexion en cours...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>

                        {/* Demo credentials */}
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Compte de démonstration :</p>
                            <div className="space-y-0.5 text-xs text-muted-foreground">
                                <p><span className="font-medium text-foreground">Email :</span> admin@dattes.tn</p>
                                <p><span className="font-medium text-foreground">Mot de passe :</span> admin123</p>
                            </div>
                        </div>
                    </form>

                    {/* Right panel */}
                    <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-8 overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center text-white space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto shadow-2xl">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Bienvenue !</h2>
                                <p className="text-white/75 mt-2 text-sm leading-relaxed">
                                    Plateforme de gestion intégrée pour le suivi et la traçabilité des dattes.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                {[
                                    { label: "Utilisateurs", icon: "👥" },
                                    { label: "Rôles", icon: "🛡️" },
                                    { label: "Audit", icon: "📋" },
                                    { label: "Sécurisé", icon: "🔒" },
                                ].map((f) => (
                                    <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                                        <span className="text-lg">{f.icon}</span>
                                        <span className="text-xs font-medium">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <p className="text-center text-xs text-muted-foreground">
                © 2026 Gestion des Dattes. Tous droits réservés.
            </p>
        </div>
    );
}
