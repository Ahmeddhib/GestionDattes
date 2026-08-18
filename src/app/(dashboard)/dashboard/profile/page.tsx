import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfilePageContent } from "./ProfilePageContent";

export const metadata = { title: "Mon profil — Gestion Dattes" };

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, active: true, createdAt: true },
    });
    if (!user) redirect("/login");

    return (
        <ProfilePageContent
            user={{
                name: user.name,
                email: user.email,
                active: user.active,
                createdAt: user.createdAt.toISOString(),
                image: session.user.image,
                provider: session.user.authProvider ?? "credentials",
                role: session.user.role,
                tenantName: session.user.tenantName,
                tenantCode: session.user.tenantCode,
            }}
        />
    );
}
