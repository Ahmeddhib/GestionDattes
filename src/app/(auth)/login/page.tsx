import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginPageContent } from "./LoginPageContent";

export const metadata = {
    title: "Connexion — Gestion Dattes"
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; logout?: string }>;
}) {
    const session = await auth();
    const { error, logout } = await searchParams;

    if (session?.user) {
        redirect(session.user.tenantId ? "/dashboard" : "/select-wakala");
    }

    return (
        <LoginPageContent
            googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
            authError={error}
            loggedOut={logout === "1"}
        />
    );
}
