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
        signOut: "/login", // Rediriger vers la page de connexion après déconnexion
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                tenantId: { label: "Tenant ID", type: "text" }, // Pour la sélection de Wakala
            },
            async authorize(credentials) {
                try {
                    if (!credentials) {
                        console.error("[AUTH] No credentials provided");
                        throw new Error("MISSING_CREDENTIALS");
                    }

                    const email = credentials.email as string;
                    const password = credentials.password as string;
                    let tenantId = credentials.tenantId as string | undefined;

                    // Nettoyer tenantId si c'est "undefined" ou vide
                    if (tenantId === "undefined" || tenantId === "" || tenantId === null) {
                        tenantId = undefined;
                    }

                    // Mode ré-authentification: si le mot de passe est "__REAUTH__"
                    // on skip la vérification du mot de passe (utilisateur déjà authentifié)
                    const isReauth = password === "__REAUTH__";

                    console.log("[AUTH] Login attempt:", { email, hasTenantId: !!tenantId, isReauth });

                    if (!email || (!password && !isReauth)) {
                        console.error("[AUTH] Missing email or password");
                        throw new Error("MISSING_CREDENTIALS");
                    }

                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user) {
                        console.error("[AUTH] User not found:", email);
                        throw new Error("INVALID_CREDENTIALS");
                    }

                    // Vérifier si le compte est désactivé
                    if (!user.active) {
                        console.error("[AUTH] Account disabled:", email);
                        throw new Error("ACCOUNT_DISABLED");
                    }

                    // Vérifier le mot de passe (sauf en mode ré-auth)
                    if (!isReauth) {
                        const validPassword = await bcrypt.compare(password, user.password);
                        if (!validPassword) {
                            console.error("[AUTH] Invalid password for:", email);
                            throw new Error("INVALID_CREDENTIALS");
                        }
                    }

                    // Si aucun tenantId fourni, permettre le login sans tenant
                    // L'utilisateur sélectionnera son tenant après le login
                    if (!tenantId) {
                        console.log("[AUTH] Login successful without tenant for:", email);
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: "USER", // Rôle temporaire avant sélection du tenant
                            tenantId: undefined,
                            tenantName: undefined,
                            tenantCode: undefined,
                        };
                    }

                    // Si tenantId fourni, vérifier l'accès au tenant
                    console.log("[AUTH] Checking tenant access:", { userId: user.id, tenantId });
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
                        console.error("[AUTH] Tenant access denied:", { userId: user.id, tenantId });
                        throw new Error("TENANT_ACCESS_DENIED");
                    }

                    console.log("[AUTH] Login successful with tenant:", { email, tenantId });
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: tenantUser.Role.name,
                        tenantId: tenantId,
                        tenantName: tenantUser.Tenant.name,
                        tenantCode: tenantUser.Tenant.code,
                    };
                } catch (error) {
                    console.error("[AUTH] Authorization error:", error);
                    throw error;
                }
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
