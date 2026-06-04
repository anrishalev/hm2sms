import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const publicPaths = ['/login', '/register', '/api/auth', '/api/webhook/sms', '/api/admin/register']
      if (publicPaths.some((p) => pathname.startsWith(p))) return true
      if (!isLoggedIn) return false
      if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && auth?.user?.role !== 'ADMIN') {
        return Response.redirect(new URL('/messages', nextUrl))
      }
      return true
    },
  },
}
