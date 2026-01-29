import { headers } from 'next/headers'
import { type BasicAuthUser, type BasicRole, getBasicAuthUserFromHeader } from '@/lib/basic-auth'

export function getBasicAuthUser(): BasicAuthUser | null {
  const headerList = headers()

  const username = headerList.get('x-basic-user')
  if (username) {
    const role = headerList.get('x-basic-role') as BasicRole | null
    const fullName = headerList.get('x-basic-name') || username
    const email = headerList.get('x-basic-email') || `${username}@jefferson.edu`

    return {
      username,
      role: role || 'viewer',
      fullName,
      email,
    }
  }

  return getBasicAuthUserFromHeader(headerList.get('authorization'))
}

export function requireBasicAuth(roles: BasicRole[] = []) {
  const user = getBasicAuthUser()
  if (!user) {
    return { error: 'Not authenticated' as const }
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return { error: 'Not authorized' as const }
  }

  return { user }
}
