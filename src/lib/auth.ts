import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Tentativa de login:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Credenciais em falta')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          console.log('[AUTH] Utilizador encontrado:', !!user)

          if (!user || !user.password) {
            console.log('[AUTH] Utilizador não encontrado ou sem password')
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.password)
          console.log('[AUTH] Password válida:', valid)

          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch (err) {
          console.error('[AUTH] Erro:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}
