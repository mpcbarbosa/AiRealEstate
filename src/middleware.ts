export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/listings/:path*',
    '/watchlists/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}
