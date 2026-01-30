const DEFAULT_DOMAIN = 'tju.local'

export function getAuthDomain() {
  return process.env.NEXT_PUBLIC_AUTH_DOMAIN || DEFAULT_DOMAIN
}

export function toLoginEmail(usernameOrEmail: string) {
  const trimmed = usernameOrEmail.trim().toLowerCase()
  if (!trimmed) return ''
  if (trimmed.includes('@')) {
    return trimmed
  }

  return `${trimmed}@${getAuthDomain()}`
}

export function toDisplayUsername(email?: string | null) {
  if (!email) return ''
  const domain = getAuthDomain().toLowerCase()
  const normalized = email.trim()
  const lower = normalized.toLowerCase()
  const suffix = `@${domain}`
  if (lower.endsWith(suffix)) {
    return normalized.slice(0, -suffix.length)
  }

  return normalized
}
