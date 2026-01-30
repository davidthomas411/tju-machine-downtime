'use server'

import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/privileged'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'
import { revalidateTag } from 'next/cache'
import type { MachineStatus } from '@/lib/types'

function extractMissingColumn(errorMessage: string, table: string) {
  const tablePattern = new RegExp(`${table}\\.([a-zA-Z0-9_]+)`)
  const cachePattern = new RegExp(`'([a-zA-Z0-9_]+)' column of '${table}'`, 'i')
  const tableMatch = errorMessage.match(tablePattern)
  if (tableMatch?.[1]) return tableMatch[1]
  const cacheMatch = errorMessage.match(cachePattern)
  if (cacheMatch?.[1]) return cacheMatch[1]
  return null
}

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

  return data.map((machine) => {
    const rawStatuses = machine.machine_statuses
    const statuses = Array.isArray(rawStatuses)
      ? rawStatuses
      : rawStatuses
        ? [rawStatuses]
        : []
    let latest = statuses[0] || null
    if (statuses.length > 1) {
      latest = statuses.reduce((current, candidate) => {
        const currentTime = current?.updated_at ? new Date(current.updated_at).getTime() : 0
        const candidateTime = candidate?.updated_at ? new Date(candidate.updated_at).getTime() : 0
        return candidateTime >= currentTime ? candidate : current
      }, latest)
    }
    return {
      ...machine,
      currentStatus: latest || null,
    }
  })
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
  const statusBasePayload = {
    machine_id: machineId,
    status,
  }
  const statusOptionalPayload = {
    notes: notes || null,
    updated_by: user.id,
    updated_at: now,
  }

  const missingStatusColumns = new Set<string>()
  let statusPayload = { ...statusBasePayload, ...statusOptionalPayload }
  let { error } = await dataClient
    .from('machine_statuses')
    .upsert(statusPayload, { onConflict: 'machine_id' })

  while (error?.message?.includes('machine_statuses.')) {
    const match = error.message.match(/machine_statuses\.(\w+)/)
    if (!match || missingStatusColumns.has(match[1])) {
      break
    }
    missingStatusColumns.add(match[1])
    delete (statusPayload as Record<string, unknown>)[match[1]]
    const retry = await dataClient
      .from('machine_statuses')
      .upsert(statusPayload, { onConflict: 'machine_id' })
    error = retry.error
  }

  if (error) {
    return { error: error.message }
  }

  const historyBasePayload = {
    machine_id: machineId,
    status,
  }
  const historyOptionalPayload = {
    notes: notes || null,
    updated_by: user.id,
    created_at: now,
  }

  const missingHistoryColumns = new Set<string>()
  let historyPayload = { ...historyBasePayload, ...historyOptionalPayload }
  let { error: historyError } = await dataClient
    .from('machine_status_history')
    .insert(historyPayload)

  while (historyError?.message?.includes('machine_status_history.')) {
    const match = historyError.message.match(/machine_status_history\.(\w+)/)
    if (!match || missingHistoryColumns.has(match[1])) {
      break
    }
    missingHistoryColumns.add(match[1])
    delete (historyPayload as Record<string, unknown>)[match[1]]
    const retry = await dataClient
      .from('machine_status_history')
      .insert(historyPayload)
    historyError = retry.error
  }

  if (historyError) {
    const isSchemaIssue =
      historyError.message.includes('machine_status_history.')
      || historyError.message.includes('schema cache')
      || historyError.message.includes('does not exist')
    if (!isSchemaIssue) {
      return { error: historyError.message }
    }
    console.error('Status history insert skipped due to schema mismatch:', historyError.message)
  }

  revalidateTag('machines', 'max')
  return { success: true }
}

export async function createMachine(formData: FormData) {
  const supabase = await createPrivilegedClient()

  const basePayload = {
    site_id: formData.get('site_id') as string,
    name: formData.get('name') as string,
  }
  const optionalPayload: Record<string, unknown> = {
    model: (formData.get('model') as string) || null,
    location: (formData.get('location') as string) || null,
    display_order: parseInt(formData.get('display_order') as string) || 0,
    is_active: formData.get('is_active') === 'true',
  }
  const optionalKeys = new Set(Object.keys(optionalPayload))
  let payload = { ...basePayload, ...optionalPayload }

  let { error } = await supabase.from('machines').insert(payload)

  while (error?.message) {
    const missingColumn = extractMissingColumn(error.message, 'machines')
    if (!missingColumn || !optionalKeys.has(missingColumn)) break
    delete (payload as Record<string, unknown>)[missingColumn]
    optionalKeys.delete(missingColumn)
    const retry = await supabase.from('machines').insert(payload)
    error = retry.error
  }

  if (error) {
    return { error: error.message }
  }

  revalidateTag('machines', 'max')
  return { success: true }
}

export async function updateMachine(machineId: string, formData: FormData) {
  const supabase = await createPrivilegedClient()

  const basePayload = {
    site_id: formData.get('site_id') as string,
    name: formData.get('name') as string,
  }
  const optionalPayload: Record<string, unknown> = {
    model: (formData.get('model') as string) || null,
    location: (formData.get('location') as string) || null,
    display_order: parseInt(formData.get('display_order') as string) || 0,
    is_active: formData.get('is_active') === 'true',
  }
  const optionalKeys = new Set(Object.keys(optionalPayload))
  let payload = { ...basePayload, ...optionalPayload }

  let { error } = await supabase
    .from('machines')
    .update(payload)
    .eq('id', machineId)

  while (error?.message) {
    const missingColumn = extractMissingColumn(error.message, 'machines')
    if (!missingColumn || !optionalKeys.has(missingColumn)) break
    delete (payload as Record<string, unknown>)[missingColumn]
    optionalKeys.delete(missingColumn)
    const retry = await supabase
      .from('machines')
      .update(payload)
      .eq('id', machineId)
    error = retry.error
  }

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
