import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopBar } from "@/components/shared/TopBar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect(ROUTES.LOGIN);
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar
                user={{
                    name: session.user.name,
                    email: session.user.email,
                    role: session.user.role,
                }}
            />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
