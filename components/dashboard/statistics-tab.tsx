'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Machine } from '@/lib/types'

interface StatsResponse {
  range: string
  rangeStart: string | null
  rangeEnd: string
  totalEvents: number
  delaysByMachine: { machineId: string; machineName: string; count: number }[]
  downByMachine: { machineId: string; machineName: string; count: number }[]
  downReasons: { reason: string; count: number }[]
}

interface StatisticsTabProps {
  siteId?: string | null
  machines: Machine[]
}

const ranges = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: 'All', value: 'all' },
]

const reasonColors = ['#0F4C81', '#1B6C8E', '#2F8F8B', '#5A9B7C', '#8AA574', '#B4AD6A']

export function StatisticsTab({ siteId, machines }: StatisticsTabProps) {
  const [range, setRange] = useState('30')
  const [machineId, setMachineId] = useState('all')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const machineOptions = useMemo(() => {
    return [
      { id: 'all', name: 'All Machines' },
      ...machines.map((machine) => ({
        id: machine.id,
        name: machine.name,
      })),
    ]
  }, [machines])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('range', range)
      if (machineId && machineId !== 'all') {
        params.set('machineId', machineId)
      }
      if (siteId) {
        params.set('siteId', siteId)
      }

      const response = await fetch(`/api/stats?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Unable to load statistics.')
      }

      const data = (await response.json()) as StatsResponse
      setStats(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load statistics.')
    } finally {
      setLoading(false)
    }
  }, [machineId, range, siteId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Operational Trends</CardTitle>
            <CardDescription>Track delays and downtime patterns across machines.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {ranges.map((item) => (
                <Button
                  key={item.value}
                  variant={range === item.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger className="w-[200px] bg-card">
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {machineOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{stats?.totalEvents ?? 0} updates captured</span>
            <span>•</span>
            <span>
              Last updated {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
            </span>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading analytics...
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Delays by Machine</CardTitle>
              <CardDescription>Count of delayed status updates.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {stats.delaysByMachine.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No delays recorded for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.delaysByMachine} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="machineName" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1B6C8E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Downtime by Machine</CardTitle>
              <CardDescription>Count of down status updates.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {stats.downByMachine.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No downtime recorded for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.downByMachine} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="machineName" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0F4C81" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Downtime Reasons</CardTitle>
              <CardDescription>Most frequent downtime notes captured.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {stats.downReasons.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No downtime reasons captured.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.downReasons}
                      dataKey="count"
                      nameKey="reason"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                    >
                      {stats.downReasons.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.reason}`}
                          fill={reasonColors[index % reasonColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
