'use server'

import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/privileged'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'
import type { Profile, Site } from '@/lib/types'

export async function getUsers(): Promise<(Profile & { site: Site | null })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .order('full_name')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export async function getUserById(userId: string | null | undefined): Promise<Profile | null> {
  if (!userId) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateDefaultSite(siteId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ site_id: siteId })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateUserSite(userId: string, siteId: string | null) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowViewerAdmin = isAdminBypassEnabled()
  if (!allowViewerAdmin && profile?.role !== 'admin') {
    return { error: 'Not authorized' }
  }

  const dataClient = allowViewerAdmin ? await createPrivilegedClient() : supabase
  const { error } = await dataClient
    .from('profiles')
    .update({ site_id: siteId })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
