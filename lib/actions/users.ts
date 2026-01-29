'use server'

import { createClient } from '@/lib/supabase/server'
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
