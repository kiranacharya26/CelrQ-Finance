import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/', // Custom sign-in page (we'll use a modal or button on home)
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Add user ID to token on sign in
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user ID to session
            if (session.user) {
                (session.user as any).id = token.id || token.sub;
            }
            return session;
        },
    }
})

export { handler as GET, handler as POST }
