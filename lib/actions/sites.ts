'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function getSites() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching sites:', error)
    return []
  }

  return data
}

export async function getSiteWithSettings(siteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sites')
    .select(`
      *,
      site_settings(*),
      widgets(*)
    `)
    .eq('id', siteId)
    .single()

  if (error) {
    console.error('Error fetching site:', error)
    return null
  }

  return data
}

export async function createSite(formData: FormData) {
  const supabase = await createClient()

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      address: formData.get('address') as string || null,
    })
    .select()
    .single()

  if (siteError) {
    return { error: siteError.message }
  }

  await supabase.from('site_settings').insert({
    site_id: site.id,
    primary_color: '#002B5C',
    secondary_color: '#B3A369',
    rotation_interval: 30,
    display_mode: 'grid',
  })

  revalidateTag('sites', 'max')
  return { success: true, site }
}

export async function updateSite(siteId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sites')
    .update({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      address: formData.get('address') as string || null,
    })
    .eq('id', siteId)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('sites', 'max')
  return { success: true }
}

export async function updateSiteSettings(siteId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_settings')
    .upsert({
      site_id: siteId,
      logo_url: formData.get('logo_url') as string || null,
      primary_color: formData.get('primary_color') as string || '#002B5C',
      secondary_color: formData.get('secondary_color') as string || '#B3A369',
      rotation_interval: parseInt(formData.get('rotation_interval') as string) || 30,
      display_mode: formData.get('display_mode') as 'grid' | 'list' | 'carousel' || 'grid',
    }, {
      onConflict: 'site_id',
    })

  if (error) {
    return { error: error.message }
  }

  revalidateTag('sites', 'max')
  return { success: true }
}

export async function deleteSite(siteId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sites')
    .delete()
    .eq('id', siteId)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('sites', 'max')
  return { success: true }
}
