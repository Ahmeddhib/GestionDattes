"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/validators/user.schema";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
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
                setError("Email ou mot de passe incorrect");
            } else {
                router.push(ROUTES.DASHBOARD);
                router.refresh();
            }
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
                <div className="animate-scale-in rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Adresse email</label>
                <Input
                    {...register("email")}
                    type="email"
                    placeholder="admin@dattes.tn"
                    className="h-11 bg-white/80 border-gray-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl transition-all"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <Input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="h-11 bg-white/80 border-gray-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl transition-all"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connexion en cours...
                    </span>
                ) : "Se connecter"}
            </Button>
        </form>
    );
}
