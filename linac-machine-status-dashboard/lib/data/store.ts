import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { Machine, MachineStatusRecord, Profile, Site, SiteSettings, Widget } from '@/lib/types'

export interface DataStore {
  sites: Site[]
  machines: Machine[]
  machine_statuses: MachineStatusRecord[]
  users: Profile[]
  widgets: Widget[]
  site_settings: SiteSettings[]
}

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json')

async function readFile(): Promise<DataStore> {
  const raw = await fs.readFile(STORE_PATH, 'utf8')
  return JSON.parse(raw) as DataStore
}

async function writeFile(store: DataStore) {
  const next = JSON.stringify(store, null, 2)
  await fs.writeFile(STORE_PATH, `${next}\n`, 'utf8')
}

export async function readStore(): Promise<DataStore> {
  try {
    return await readFile()
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code !== 'ENOENT') {
      throw err
    }

    const emptyStore: DataStore = {
      sites: [],
      machines: [],
      machine_statuses: [],
      users: [],
      widgets: [],
      site_settings: [],
    }

    await writeFile(emptyStore)
    return emptyStore
  }
}

export async function writeStore(store: DataStore) {
  await writeFile(store)
}

export function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`
}

export function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByDisplayOrder<T extends { display_order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.display_order - b.display_order)
}
