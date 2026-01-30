'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TJULogo } from '@/components/tju-logo'
import { MachineStatusCard } from '@/components/dashboard/machine-status-card'
import { WeatherWidget } from '@/components/display/weather-widget'
import { ClockWidget } from '@/components/display/clock-widget'
import { Button } from '@/components/ui/button'
import type { Machine, MachineStatusRecord, Site } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

interface DisplayDashboardProps {
  machines: (Machine & { currentStatus: MachineStatusRecord | null })[]
  site: Site | null
  sites: Site[]
}

export function DisplayDashboard({ machines, site, sites }: DisplayDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('display-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machine_statuses',
        },
        () => {
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machines',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  useEffect(() => {
    setCurrentTime(new Date())
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const onTimeCount = machines.filter((m) => !m.currentStatus || m.currentStatus.status === 'on_time').length
  const delayedCount = machines.filter((m) => m.currentStatus?.status?.startsWith('delayed_')).length
  const downCount = machines.filter((m) => m.currentStatus?.status?.startsWith('down_')).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-5">
            <TJULogo size="lg" className="[&_span]:text-primary-foreground [&_span]:opacity-90" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary-foreground/60">
                Radiation Oncology
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">LINAC Status</h1>
                <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-primary-foreground/15 text-primary-foreground/80">
                  Display Mode
                </span>
              </div>
              {site && (
                <p className="text-sm text-primary-foreground/70">{site.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <WeatherWidget />
            <div className="h-10 w-px bg-primary-foreground/20" />
            <ClockWidget time={currentTime} />
            <Button
              variant="ghost"
              className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Staff Console
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-8 pb-24 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">LINAC Machine Status</h2>
            <p className="text-sm text-slate-500">
              Waiting room display · live operational overview
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusPill label="On Time" count={onTimeCount} colorClass="bg-status-on-time" />
            <StatusPill label="Delayed" count={delayedCount} colorClass="bg-status-delayed" />
            <StatusPill label="Down" count={downCount} colorClass="bg-status-down" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {machines.map((machine) => (
            <MachineStatusCard
              key={machine.id}
              machine={machine}
              canEdit={false}
              disableAnimations
            />
          ))}
        </div>

        {machines.length === 0 && (
          <div className="mt-10 text-center py-20 bg-white/70 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-500">No machines configured for this site.</p>
          </div>
        )}

        {sites.length > 1 && (
          <div className="mt-10 border border-slate-200 bg-white/80 backdrop-blur rounded-xl px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Switch Site</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sites.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/display?site=${s.id}`)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    s.id === site?.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-8 py-3 text-xs text-slate-500">
          <span>Thomas Jefferson University Health System · Department of Radiation Oncology</span>
          <span>
            Last refreshed {currentTime ? currentTime.toLocaleTimeString() : '--:--'}
          </span>
        </div>
      </footer>
    </div>
  )
}

function StatusPill({
  label,
  count,
  colorClass,
}: {
  label: string
  count: number
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className="font-semibold text-slate-900 tabular-nums">{count}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  )
}
