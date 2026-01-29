'use server'

import { readStore } from '@/lib/data/store'
import type { Profile, Site } from '@/lib/types'

export async function getUsers(): Promise<(Profile & { site: Site | null })[]> {
  const store = await readStore()
  const sitesById = new Map(store.sites.map((site) => [site.id, site]))
  return [...store.users]
    .map((user) => ({
      ...user,
      site: user.site_id ? sitesById.get(user.site_id) || null : null,
    }))
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
}

export async function getUserById(userId: string | null | undefined): Promise<Profile | null> {
  if (!userId) return null
  const store = await readStore()
  const user = store.users.find((item) => item.id === userId) || null
  if (!user) return null

  if (user.site_id) {
    const site = store.sites.find((item) => item.id === user.site_id) || null
    return { ...user, site }
  }

  return user
}
