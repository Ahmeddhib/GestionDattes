import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/lib/routes";

export const metadata = {
    title: "Connexion — Gestion des Dattes",
    description: "Connectez-vous à votre espace de gestion des dattes.",
};

export default async function LoginPage() {
    const session = await auth();
    if (session) redirect(ROUTES.DASHBOARD);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    );
}
