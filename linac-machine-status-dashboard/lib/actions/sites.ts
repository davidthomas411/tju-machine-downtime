'use server'

import { revalidatePath } from 'next/cache'
import { readStore, writeStore, createId, sortByName } from '@/lib/data/store'
import { notifyUpdate } from '@/lib/realtime'
import { requireBasicAuth } from '@/lib/basic-auth-server'

export async function getSites() {
  const store = await readStore()
  return sortByName(store.sites)
}

export async function getSiteWithSettings(siteId: string) {
  const store = await readStore()
  const site = store.sites.find((item) => item.id === siteId) || null
  if (!site) return null

  return {
    ...site,
    site_settings: store.site_settings.filter((setting) => setting.site_id === siteId),
    widgets: store.widgets.filter((widget) => widget.site_id === siteId),
  }
}

export async function createSite(formData: FormData) {
  const auth = requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const name = formData.get('name') as string
  const code = formData.get('code') as string

  if (!name || !code) {
    return { error: 'Name and code are required' }
  }

  const siteId = createId('site')

  const site = {
    id: siteId,
    name,
    code,
    address: (formData.get('address') as string) || null,
    created_at: new Date().toISOString(),
  }

  store.sites.push(site)
  store.site_settings.push({
    id: createId('settings'),
    site_id: siteId,
    logo_url: null,
    primary_color: '#002B5C',
    secondary_color: '#B3A369',
    rotation_interval: 15,
    display_mode: 'grid',
    created_at: new Date().toISOString(),
  })

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true, site }
}

export async function updateSite(siteId: string, formData: FormData) {
  const auth = requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const siteIndex = store.sites.findIndex((site) => site.id === siteId)

  if (siteIndex === -1) {
    return { error: 'Site not found' }
  }

  store.sites[siteIndex] = {
    ...store.sites[siteIndex],
    name: (formData.get('name') as string) || store.sites[siteIndex].name,
    code: (formData.get('code') as string) || store.sites[siteIndex].code,
    address: (formData.get('address') as string) || null,
  }

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}

export async function updateSiteSettings(siteId: string, formData: FormData) {
  const auth = requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const settingsIndex = store.site_settings.findIndex((setting) => setting.site_id === siteId)

  const updated = {
    id: settingsIndex === -1 ? createId('settings') : store.site_settings[settingsIndex].id,
    site_id: siteId,
    logo_url: (formData.get('logo_url') as string) || null,
    primary_color: (formData.get('primary_color') as string) || '#002B5C',
    secondary_color: (formData.get('secondary_color') as string) || '#B3A369',
    rotation_interval: parseInt((formData.get('rotation_interval') as string) || '15', 10),
    display_mode:
      ((formData.get('display_mode') as string) as 'grid' | 'list' | 'carousel') || 'grid',
    created_at:
      settingsIndex === -1
        ? new Date().toISOString()
        : store.site_settings[settingsIndex].created_at,
  }

  if (settingsIndex === -1) {
    store.site_settings.push(updated)
  } else {
    store.site_settings[settingsIndex] = updated
  }

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}

export async function deleteSite(siteId: string) {
  const auth = requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()

  const machineIds = store.machines
    .filter((machine) => machine.site_id === siteId)
    .map((machine) => machine.id)

  store.sites = store.sites.filter((site) => site.id !== siteId)
  store.machines = store.machines.filter((machine) => machine.site_id !== siteId)
  store.machine_statuses = store.machine_statuses.filter(
    (status) => !machineIds.includes(status.machine_id),
  )
  store.site_settings = store.site_settings.filter((setting) => setting.site_id !== siteId)

  store.users = store.users.map((user) => ({
    ...user,
    site_id: user.site_id === siteId ? null : user.site_id,
  }))

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}
