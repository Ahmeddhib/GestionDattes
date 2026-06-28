import NextAuth from "next-auth";

// Version Edge-compatible de auth (sans Prisma)
// Utilisée uniquement dans le middleware
export const {
    auth: authEdge,
} = NextAuth({
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [],
});
