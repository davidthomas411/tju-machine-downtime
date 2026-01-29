import { NextResponse, type NextRequest } from 'next/server'
import { getBasicAuthUserFromHeader } from '@/lib/basic-auth'

export function middleware(request: NextRequest) {
  const user = getBasicAuthUserFromHeader(request.headers.get('authorization'))

  if (!user) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="TJU LINAC Dashboard"',
      },
    })
  }

  const headers = new Headers(request.headers)
  headers.set('x-basic-user', user.username)
  headers.set('x-basic-role', user.role)
  headers.set('x-basic-name', user.fullName)
  headers.set('x-basic-email', user.email)

  return NextResponse.next({
    request: {
      headers,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
