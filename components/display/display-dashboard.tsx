'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand-logo'
import { MachineStatusCard } from '@/components/dashboard/machine-status-card'
import { WeatherWidget } from '@/components/display/weather-widget'
import { ClockWidget } from '@/components/display/clock-widget'
import { Button } from '@/components/ui/button'
import type { Machine, MachineStatusRecord, Site } from '@/lib/types'
import { ArrowLeft, Maximize2 } from 'lucide-react'
import { normalizeNetwork, type NetworkKey } from '@/lib/network'

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

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  async function handleFullscreen() {
    if (typeof document === 'undefined') return
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ('webkitExitFullscreen' in document) {
          await (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.()
        }
        return
      }

      const element = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
      }

      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error)
    }
  }

  const onTimeCount = machines.filter((m) => !m.currentStatus || m.currentStatus.status === 'on_time').length
  const delayedCount = machines.filter((m) => m.currentStatus?.status?.startsWith('delayed_')).length
  const downCount = machines.filter((m) => m.currentStatus?.status?.startsWith('down_')).length
  const activeNetwork = normalizeNetwork(site?.network || null) || 'tju'
  const isLvhn = activeNetwork === 'lvhn'
  const headerClass = isLvhn
    ? 'bg-white text-slate-900 border-b border-slate-200'
    : 'bg-primary text-primary-foreground'

  const networks = Array.from(new Set(
    sites.map((s) => normalizeNetwork(s.network || null) || 'tju')
  )) as NetworkKey[]

  const sitesByNetwork = networks.reduce((acc, network) => {
    acc[network] = sites.filter((s) => (normalizeNetwork(s.network || null) || 'tju') === network)
    return acc
  }, {} as Record<NetworkKey, Site[]>)

  function handleNetworkChange(nextNetwork: NetworkKey) {
    if (nextNetwork === activeNetwork) return
    const nextSites = sitesByNetwork[nextNetwork] || []
    const fallbackSite = nextSites[0]
    const params = new URLSearchParams()
    params.set('network', nextNetwork)
    if (fallbackSite) {
      params.set('site', fallbackSite.id)
    }
    router.push(`/display?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100" data-network={activeNetwork}>
      <header className={headerClass}>
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-8 py-6">
          <div className="flex items-center gap-5">
            <BrandLogo network={activeNetwork} variant="compact" size="lg" />
          </div>
          <div className="flex items-center gap-6">
            <WeatherWidget tone={isLvhn ? 'dark' : 'light'} network={activeNetwork} />
            <div className={`h-10 w-px ${isLvhn ? 'bg-slate-200' : 'bg-primary-foreground/20'}`} />
            <ClockWidget time={currentTime} tone={isLvhn ? 'dark' : 'light'} />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={isLvhn
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }
                onClick={handleFullscreen}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Full Screen
              </Button>
              <Button
                variant="ghost"
                className={isLvhn
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Staff Console
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-8 pb-24 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">LINAC Machine Status</h2>
            <p className="text-sm text-slate-500">
              {site?.name || 'Hospital Display'} · live operational overview
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusPill label="On Time" count={onTimeCount} colorClass="bg-status-on-time" />
            <StatusPill label="Delayed" count={delayedCount} colorClass="bg-status-delayed" />
            <StatusPill label="Down" count={downCount} colorClass="bg-status-down" />
          </div>
        </div>

        {networks.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Hospital
            </span>
            <div className="flex flex-wrap gap-2">
              {networks.map((network) => (
                <button
                  key={network}
                  onClick={() => handleNetworkChange(network)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    network === activeNetwork
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {network === 'tju' ? 'TJU' : 'LVH'}
                </button>
              ))}
            </div>
          </div>
        )}

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
