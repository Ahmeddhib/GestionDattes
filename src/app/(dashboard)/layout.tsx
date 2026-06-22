import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { DashboardNav } from "@/components/layout/dashboard-nav";

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
        <div className="min-h-screen bg-gray-100">
            <DashboardNav session={session} />
            <main>{children}</main>
        </div>
    );
}
