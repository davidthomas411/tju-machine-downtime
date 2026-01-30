'use server'

import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/privileged'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'
import { revalidateTag } from 'next/cache'
import type { MachineStatus } from '@/lib/types'

export async function getMachinesWithStatus(siteId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('machines')
    .select(`
      *,
      site:sites(*),
      machine_statuses(*)
    `)
    .eq('is_active', true)
    .order('display_order')

  if (siteId) {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching machines:', error)
    return []
  }

  return data.map((machine) => ({
    ...machine,
    currentStatus: machine.machine_statuses?.[0] || null,
  }))
}

export async function updateMachineStatus(
  machineId: string,
  status: MachineStatus,
  notes?: string,
) {
  const supabase = await createClient()
  const dataClient = isAdminBypassEnabled() ? await createPrivilegedClient() : supabase

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const now = new Date().toISOString()
  const { error } = await dataClient
    .from('machine_statuses')
    .upsert({
      machine_id: machineId,
      status,
      notes: notes || null,
      updated_by: user.id,
      updated_at: now,
    }, {
      onConflict: 'machine_id',
    })

  if (error) {
    return { error: error.message }
  }

  const { error: historyError } = await dataClient
    .from('machine_status_history')
    .insert({
      machine_id: machineId,
      status,
      notes: notes || null,
      updated_by: user.id,
      created_at: now,
    })

  if (historyError) {
    return { error: historyError.message }
  }

  revalidateTag('machines', 'max')
  return { success: true }
}

export async function createMachine(formData: FormData) {
  const supabase = await createPrivilegedClient()

  const { error } = await supabase.from('machines').insert({
    site_id: formData.get('site_id') as string,
    name: formData.get('name') as string,
    model: formData.get('model') as string || null,
    location: formData.get('location') as string || null,
    display_order: parseInt(formData.get('display_order') as string) || 0,
    is_active: formData.get('is_active') === 'true',
  })

  if (error) {
    return { error: error.message }
  }

  revalidateTag('machines', 'max')
  return { success: true }
}

export async function updateMachine(machineId: string, formData: FormData) {
  const supabase = await createPrivilegedClient()

  const { error } = await supabase
    .from('machines')
    .update({
      site_id: formData.get('site_id') as string,
      name: formData.get('name') as string,
      model: formData.get('model') as string || null,
      location: formData.get('location') as string || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', machineId)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('machines', 'max')
  return { success: true }
}

export async function deleteMachine(machineId: string) {
  const supabase = await createPrivilegedClient()

  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', machineId)

  if (error) {
    return { error: error.message }
  }

  revalidateTag('machines', 'max')
  return { success: true }
}
