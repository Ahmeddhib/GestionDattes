import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/lib/routes";

export default async function LoginPage() {
    const session = await auth();
    if (session) redirect(ROUTES.DASHBOARD);

    return (
        <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
            {/* Decorative blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-300/20 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Card */}
                <div className="glass rounded-3xl shadow-2xl shadow-violet-500/10 p-8 border border-white/60">

                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold gradient-text">Gestion des Dattes</h1>
                        <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre espace</p>
                    </div>

                    <LoginForm />

                    {/* Hint */}
                    <div className="mt-6 p-3 rounded-xl bg-violet-50/80 border border-violet-100">
                        <p className="text-xs text-violet-600 font-medium text-center">
                            💡 Compte admin: <span className="font-mono">admin@dattes.tn</span> / <span className="font-mono">admin123</span>
                        </p>
                    </div>
                </div>

                {/* Bottom text */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2026 Gestion Dattes — Système de gestion interne
                </p>
            </div>
        </div>
    );
}
