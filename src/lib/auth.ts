import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
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
            image?: string | null;
            authProvider?: "credentials" | "google";
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
        image?: string | null;
        authProvider?: "credentials" | "google";
    }
}

// Note: NextAuth v5 beta gère JWT automatiquement via le token callback
// Pas besoin de declare module "next-auth/jwt"

export const {
    handlers,
    signIn,
    signOut,
    auth,
    unstable_update,
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

                    console.log("[AUTH] Login attempt:", { email, hasTenantId: !!tenantId });

                    if (!email || !password) {
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

                    // Une connexion Credentials exige toujours le mot de passe réel.
                    const validPassword = await bcrypt.compare(password, user.password);
                    if (!validPassword) {
                        console.error("[AUTH] Invalid password for:", email);
                        throw new Error("INVALID_CREDENTIALS");
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
        Google,
    ],
    callbacks: {
        /**
         * JWT Callback
         * Appelé chaque fois qu'un JWT est créé ou mis à jour
         * Utilisé pour ajouter des données personnalisées au token
         */
        async jwt({ token, user, trigger, session }) {
            // Premier login : ajouter les infos utilisateur au token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.tenantId = user.tenantId;
                token.tenantName = user.tenantName;
                token.tenantCode = user.tenantCode;
                token.picture = user.image;
                token.authProvider = user.authProvider ?? "credentials";

                console.log("[JWT] Token créé pour:", {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                });
            }

            if (trigger === "update" && session?.user?.name) {
                token.name = session.user.name;
            }

            // Mise à jour du tenant (changement de Wakala)
            if (trigger === "update" && session?.user?.tenantId && token.id) {
                const tenantUser = await prisma.tenantUser.findUnique({
                    where: {
                        userId_tenantId: {
                            userId: token.id as string,
                            tenantId: session.user.tenantId,
                        },
                    },
                    include: {
                        Role: { select: { name: true } },
                        Tenant: { select: { name: true, code: true, active: true } },
                    },
                });

                if (tenantUser?.active && tenantUser.Tenant.active) {
                    token.tenantId = session.user.tenantId;
                    token.tenantName = tenantUser.Tenant.name;
                    token.tenantCode = tenantUser.Tenant.code;
                    token.role = tenantUser.Role.name;
                }
            }

            return token;
        },

        /**
         * Session Callback
         * Appelé chaque fois qu'une session est vérifiée
         * Utilisé pour exposer les données du token à la session côté client
         */
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string | undefined;
                session.user.tenantName = token.tenantName as string | undefined;
                session.user.tenantCode = token.tenantCode as string | undefined;
                session.user.image = token.picture ?? null;
                session.user.authProvider = token.authProvider as "credentials" | "google" | undefined;
            }
            return session;
        },

        /**
         * SignIn Callback
         * Appelé après l'authentification réussie
         * Retourne false pour bloquer la connexion
         */
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === "google") {
                    const googleProfile = profile as { email_verified?: boolean; picture?: string } | undefined;
                    const normalizedEmail = user.email?.trim().toLowerCase();

                    // Une adresse vérifiée est indispensable avant toute liaison par e-mail.
                    if (!normalizedEmail || googleProfile?.email_verified !== true) {
                        console.error("[SIGNIN] Adresse Google absente ou non vérifiée");
                        return false;
                    }

                    let dbUser = await prisma.user.findUnique({
                        where: { email: normalizedEmail },
                    });

                    if (!dbUser) {
                        if (process.env.AUTH_GOOGLE_ALLOW_SIGNUP !== "true") {
                            console.warn("[SIGNIN] Compte Google non rattaché:", normalizedEmail);
                            return "/login?error=GoogleAccountNotLinked";
                        }

                        // Ce secret aléatoire ne peut pas servir à une connexion Credentials.
                        const unusablePassword = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
                        dbUser = await prisma.user.create({
                            data: {
                                id: createId(),
                                name: user.name?.trim() || normalizedEmail.split("@")[0],
                                email: normalizedEmail,
                                password: unusablePassword,
                                active: true,
                            },
                        });
                    }

                    if (!dbUser.active) {
                        console.error("[SIGNIN] Compte Google désactivé:", normalizedEmail);
                        return false;
                    }

                    // Le JWT doit contenir l'identifiant interne, pas le subject Google.
                    user.id = dbUser.id;
                    user.email = dbUser.email;
                    user.name = dbUser.name;
                    user.role = "USER";
                    user.image = googleProfile?.picture ?? user.image ?? null;
                    user.authProvider = "google";
                    user.tenantId = undefined;
                    user.tenantName = undefined;
                    user.tenantCode = undefined;

                    console.log("[SIGNIN] Connexion Google autorisée pour:", dbUser.email);
                    return true;
                }

                // Vérifier que l'utilisateur est actif
                if (user.id) {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { active: true },
                    });

                    if (!dbUser || !dbUser.active) {
                        console.error("[SIGNIN] Compte désactivé:", user.email);
                        return false;
                    }
                }

                // Si un tenantId est présent, vérifier l'accès
                if (user.tenantId) {
                    const tenantUser = await prisma.tenantUser.findUnique({
                        where: {
                            userId_tenantId: {
                                userId: user.id,
                                tenantId: user.tenantId,
                            },
                        },
                        include: {
                            Tenant: {
                                select: { active: true },
                            },
                        },
                    });

                    if (!tenantUser || !tenantUser.active || !tenantUser.Tenant.active) {
                        console.error("[SIGNIN] Accès tenant refusé:", {
                            userId: user.id,
                            tenantId: user.tenantId,
                        });
                        return false;
                    }
                }

                console.log("[SIGNIN] Connexion autorisée pour:", user.email);
                return true;
            } catch (error) {
                console.error("[SIGNIN] Erreur lors de la vérification:", error);
                return false;
            }
        },

        /**
         * Redirect Callback
         * Appelé lors des redirections (login, logout, callbacks)
         * Permet de personnaliser les redirections
         */
        async redirect({ url, baseUrl }) {
            console.log("[REDIRECT] Redirection demandée:", { url, baseUrl });

            // Si l'URL est relative, la préfixer avec baseUrl
            if (url.startsWith("/")) {
                const redirectUrl = `${baseUrl}${url}`;
                console.log("[REDIRECT] Redirection relative:", redirectUrl);
                return redirectUrl;
            }

            // Si l'URL contient baseUrl, la retourner telle quelle
            if (url.startsWith(baseUrl)) {
                console.log("[REDIRECT] Redirection absolue (même domaine):", url);
                return url;
            }

            // Par défaut, rediriger vers le dashboard ou select-wakala
            console.log("[REDIRECT] Redirection par défaut vers:", `${baseUrl}/dashboard`);
            return `${baseUrl}/dashboard`;
        },
    },
    // Activez AUTH_DEBUG=true uniquement pour un diagnostic ponctuel.
    debug: process.env.AUTH_DEBUG === "true",
});
