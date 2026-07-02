import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            tenantId?: string; // Wakala sélectionnée
            tenantName?: string;
            tenantCode?: string;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId?: string;
        tenantName?: string;
        tenantCode?: string;
    }
}

// Note: NextAuth v5 beta gère JWT automatiquement via le token callback
// Pas besoin de declare module "next-auth/jwt"

export const {
    handlers,
    signIn,
    signOut,
    auth,
} = NextAuth({
    basePath: "/api/auth",
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
        signOut: "/", // Rediriger vers la page d'accueil (sélection Wakala) après déconnexion
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                tenantId: { label: "Tenant ID", type: "text" }, // Pour la sélection de Wakala
            },
            async authorize(credentials) {
                const email = credentials.email as string;
                const password = credentials.password as string;
                const tenantId = credentials.tenantId as string | undefined;

                if (!email || !password) {
                    throw new Error("MISSING_CREDENTIALS");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    throw new Error("INVALID_CREDENTIALS");
                }

                // Vérifier si le compte est désactivé
                if (!user.active) {
                    throw new Error("ACCOUNT_DISABLED");
                }

                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    throw new Error("INVALID_CREDENTIALS");
                }

                // Multi-tenant: tenantId est OBLIGATOIRE
                // L'utilisateur doit sélectionner une Wakala avant de se connecter
                if (!tenantId) {
                    throw new Error("TENANT_SELECTION_REQUIRED");
                }

                const tenantUser = await prisma.tenantUser.findUnique({
                    where: {
                        userId_tenantId: {
                            userId: user.id,
                            tenantId,
                        },
                    },
                    include: {
                        Role: {
                            select: {
                                name: true,
                            },
                        },
                        Tenant: {
                            select: {
                                name: true,
                                code: true,
                                active: true,
                            },
                        },
                    },
                });

                if (!tenantUser || !tenantUser.active || !tenantUser.Tenant.active) {
                    throw new Error("TENANT_ACCESS_DENIED");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: tenantUser.Role.name,
                    tenantId: tenantId,
                    tenantName: tenantUser.Tenant.name,
                    tenantCode: tenantUser.Tenant.code,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.tenantId = user.tenantId;
                token.tenantName = user.tenantName;
                token.tenantCode = user.tenantCode;
            }

            // Support pour update du tenant via session update
            if (trigger === "update" && session) {
                token.tenantId = session.tenantId;
                token.tenantName = session.tenantName;
                token.tenantCode = session.tenantCode;
                token.role = session.role;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string | undefined;
                session.user.tenantName = token.tenantName as string | undefined;
                session.user.tenantCode = token.tenantCode as string | undefined;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
});
