import { NextRequest, NextResponse } from 'next/server'
import { createPrivilegedClient } from '@/lib/supabase/privileged'

type StatsRow = {
  machine_id: string
  status: string
  notes: string | null
  created_at: string
  machine?: {
    id: string
    name: string | null
    site_id: string | null
  } | null
}

function toISO(date: Date) {
  return date.toISOString()
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '30'
  const machineId = url.searchParams.get('machineId') || ''
  const siteId = url.searchParams.get('siteId') || ''

  const now = new Date()
  let start: string | null = null
  if (range !== 'all') {
    const days = Number.parseInt(range, 10)
    if (Number.isFinite(days) && days > 0) {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)
      start = toISO(startDate)
    }
  }

  const supabase = await createPrivilegedClient()

  let query = supabase
    .from('machine_status_history')
    .select('machine_id, status, notes, created_at, machine:machines!inner(id, name, site_id)')

  if (start) {
    query = query.gte('created_at', start)
  }

  if (machineId) {
    query = query.eq('machine_id', machineId)
  }

  if (siteId) {
    query = query.eq('machine.site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data || []) as StatsRow[]

  const delaysByMachine = new Map<string, { machineId: string; machineName: string; count: number }>()
  const downByMachine = new Map<string, { machineId: string; machineName: string; count: number }>()
  const downReasons = new Map<string, number>()

  rows.forEach((row) => {
    const machineName = row.machine?.name || 'Unknown'
    if (row.status.startsWith('delayed_')) {
      const current = delaysByMachine.get(row.machine_id) || {
        machineId: row.machine_id,
        machineName,
        count: 0,
      }
      current.count += 1
      delaysByMachine.set(row.machine_id, current)
    }

    if (row.status.startsWith('down_')) {
      const current = downByMachine.get(row.machine_id) || {
        machineId: row.machine_id,
        machineName,
        count: 0,
      }
      current.count += 1
      downByMachine.set(row.machine_id, current)

      const reason = row.notes?.trim() || 'Unspecified'
      downReasons.set(reason, (downReasons.get(reason) || 0) + 1)
    }
  })

  const response = {
    range,
    rangeStart: start,
    rangeEnd: toISO(now),
    totalEvents: rows.length,
    delaysByMachine: Array.from(delaysByMachine.values()).sort((a, b) => b.count - a.count),
    downByMachine: Array.from(downByMachine.values()).sort((a, b) => b.count - a.count),
    downReasons: Array.from(downReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }

  return NextResponse.json(response)
}
