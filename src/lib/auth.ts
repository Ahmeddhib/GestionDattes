import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const {
    handlers,
    signIn,
    signOut,
    auth,
} = NextAuth({
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials.email as string;
                const password = credentials.password as string;

                if (!email || !password) {
                    throw new Error("MISSING_CREDENTIALS");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { role: true },
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

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role.name,
                    name: user.name,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
});
