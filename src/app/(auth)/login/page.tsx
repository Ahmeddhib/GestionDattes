import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginPageContent } from "./LoginPageContent";

export const metadata = {
    title: "Connexion — Gestion Dattes"
};

export default async function LoginPage() {
    const session = await auth();

    if (session?.user) {
        redirect(session.user.tenantId ? "/dashboard" : "/select-wakala");
    }

    return <LoginPageContent />;
}
