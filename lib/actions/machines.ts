'use server'

import { revalidatePath } from 'next/cache'
import type { MachineStatus } from '@/lib/types'
import { readStore, writeStore, createId, sortByDisplayOrder } from '@/lib/data/store'
import { notifyUpdate } from '@/lib/realtime'
import { requireBasicAuth } from '@/lib/basic-auth-server'

function getLatestStatus(statuses: { updated_at: string }[]) {
  return statuses
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
}

export async function getMachinesWithStatus(siteId?: string) {
  const store = await readStore()
  const sitesById = new Map(store.sites.map((site) => [site.id, site]))

  let machines = store.machines.filter((machine) => machine.is_active)
  if (siteId) {
    machines = machines.filter((machine) => machine.site_id === siteId)
  }

  const sortedMachines = sortByDisplayOrder(machines)

  return sortedMachines.map((machine) => {
    const status = getLatestStatus(
      store.machine_statuses.filter((entry) => entry.machine_id === machine.id),
    )

    return {
      ...machine,
      site: sitesById.get(machine.site_id) || null,
      currentStatus: status || null,
    }
  })
}

export async function getMachines() {
  const store = await readStore()
  const sitesById = new Map(store.sites.map((site) => [site.id, site]))
  const sortedMachines = sortByDisplayOrder(store.machines)

  return sortedMachines.map((machine) => ({
    ...machine,
    site: sitesById.get(machine.site_id) || null,
  }))
}

export async function updateMachineStatus(
  machineId: string,
  status: MachineStatus,
  notes?: string,
) {
  const auth = await requireBasicAuth(['admin', 'staff'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const updatedAt = new Date().toISOString()

  const existingIndex = store.machine_statuses.findIndex(
    (entry) => entry.machine_id === machineId,
  )

  if (existingIndex >= 0) {
    store.machine_statuses[existingIndex] = {
      ...store.machine_statuses[existingIndex],
      status,
      notes: notes || null,
      updated_by: auth.user.username,
      updated_at: updatedAt,
    }
  } else {
    store.machine_statuses.push({
      id: createId('status'),
      machine_id: machineId,
      status,
      notes: notes || null,
      updated_by: auth.user.username,
      updated_at: updatedAt,
    })
  }

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/display')

  return { success: true }
}

export async function createMachine(formData: FormData) {
  const auth = await requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const siteId = formData.get('site_id') as string
  const name = formData.get('name') as string

  if (!siteId || !name) {
    return { error: 'Site and name are required' }
  }

  const machine = {
    id: createId('machine'),
    site_id: siteId,
    name,
    model: (formData.get('model') as string) || null,
    location: (formData.get('location') as string) || null,
    display_order: parseInt((formData.get('display_order') as string) || '0', 10),
    is_active: formData.get('is_active') === 'true',
    created_at: new Date().toISOString(),
  }

  store.machines.push(machine)
  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}

export async function updateMachine(machineId: string, formData: FormData) {
  const auth = await requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  const machineIndex = store.machines.findIndex((machine) => machine.id === machineId)

  if (machineIndex === -1) {
    return { error: 'Machine not found' }
  }

  store.machines[machineIndex] = {
    ...store.machines[machineIndex],
    site_id: (formData.get('site_id') as string) || store.machines[machineIndex].site_id,
    name: (formData.get('name') as string) || store.machines[machineIndex].name,
    model: (formData.get('model') as string) || null,
    location: (formData.get('location') as string) || null,
    display_order: parseInt((formData.get('display_order') as string) || '0', 10),
    is_active: formData.get('is_active') === 'true',
  }

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}

export async function deleteMachine(machineId: string) {
  const auth = await requireBasicAuth(['admin'])
  if ('error' in auth) {
    return { error: auth.error }
  }

  const store = await readStore()
  store.machines = store.machines.filter((machine) => machine.id !== machineId)
  store.machine_statuses = store.machine_statuses.filter(
    (status) => status.machine_id !== machineId,
  )

  await writeStore(store)
  notifyUpdate()
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')

  return { success: true }
}
