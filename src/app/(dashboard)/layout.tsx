import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";
import { MainScrollRestoration } from "@/components/shared/MainScrollRestoration";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect(ROUTES.LOGIN);
    }

    // Si pas de tenant, rediriger vers select-wakala
    if (!session.user.tenantId) {
        redirect("/select-wakala");
    }

    // Shell à hauteur d'écran : la racine ne défile jamais, seul <main> défile.
    // C'est ce qui rend la barre latérale réellement fixe — avec `sticky` elle
    // suivait le défilement du document, et sa propre zone de navigation ne
    // pouvait pas défiler indépendamment du contenu.
    return (
        <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-[#FAF0DC]">
            <Sidebar
                className="hidden h-full w-64 shrink-0 lg:flex 2xl:w-72"
                user={{
                    name: session.user.name,
                    email: session.user.email,
                    role: session.user.role,
                }}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar
                    user={{
                        id: session.user.id,
                        tenantId: session.user.tenantId,
                        tenantName: session.user.tenantName,
                        tenantCode: session.user.tenantCode,
                        name: session.user.name,
                        email: session.user.email,
                        role: session.user.role,
                    }}
                />
                <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#FAF0DC]">
                    {children}
                </main>
                <MainScrollRestoration />
            </div>
        </div>
    );
}
