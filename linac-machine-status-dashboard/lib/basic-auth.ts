export type BasicRole = 'admin' | 'staff' | 'viewer'

export interface BasicAuthUser {
  username: string
  role: BasicRole
  fullName: string
  email: string
}

interface BasicAuthConfig extends BasicAuthUser {
  password: string
}

const DEFAULT_USERS: BasicAuthConfig[] = [
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    fullName: 'Admin User',
    email: 'admin@jefferson.edu',
  },
  {
    username: 'user1',
    password: 'user1',
    role: 'staff',
    fullName: 'Staff User',
    email: 'user1@jefferson.edu',
  },
]

function decodeBase64(value: string) {
  if (typeof globalThis.atob !== 'function') {
    throw new Error('Base64 decoding is not available in this runtime.')
  }

  return globalThis.atob(value)
}

function toPublicUser(user: BasicAuthConfig): BasicAuthUser {
  const { password: _password, ...rest } = user
  return rest
}

export function parseBasicAuthUsers(envValue?: string): BasicAuthConfig[] {
  if (!envValue) {
    return DEFAULT_USERS
  }

  const entries = envValue
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (entries.length === 0) {
    return DEFAULT_USERS
  }

  const parsed = entries
    .map((entry) => {
      const [username, password, roleRaw, fullNameRaw, emailRaw] = entry.split(':')
      if (!username || !password) return null

      const role = (roleRaw as BasicRole) || 'viewer'
      return {
        username,
        password,
        role: role === 'admin' || role === 'staff' || role === 'viewer' ? role : 'viewer',
        fullName: fullNameRaw || username,
        email: emailRaw || `${username}@jefferson.edu`,
      } satisfies BasicAuthConfig
    })
    .filter((entry): entry is BasicAuthConfig => Boolean(entry))

  return parsed.length > 0 ? parsed : DEFAULT_USERS
}

export function getBasicAuthConfig(): BasicAuthConfig[] {
  return parseBasicAuthUsers(process.env.BASIC_AUTH_USERS)
}

export function getBasicAuthUserFromHeader(header: string | null): BasicAuthUser | null {
  if (!header) return null

  const [scheme, encoded] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'basic' || !encoded) {
    return null
  }

  let decoded = ''
  try {
    decoded = decodeBase64(encoded)
  } catch {
    return null
  }

  const separatorIndex = decoded.indexOf(':')
  if (separatorIndex === -1) return null

  const username = decoded.slice(0, separatorIndex)
  const password = decoded.slice(separatorIndex + 1)

  const match = getBasicAuthConfig().find(
    (user) => user.username === username && user.password === password,
  )

  return match ? toPublicUser(match) : null
}

export function getPublicUsers(): BasicAuthUser[] {
  return getBasicAuthConfig().map(toPublicUser)
}
