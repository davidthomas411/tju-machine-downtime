'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TJULogo } from '@/components/tju-logo'
import { MachineStatusCard } from '@/components/dashboard/machine-status-card'
import { WeatherWidget } from '@/components/display/weather-widget'
import { ClockWidget } from '@/components/display/clock-widget'
import { WebcamWidget } from '@/components/display/webcam-widget'
import { AnnouncementWidget } from '@/components/display/announcement-widget'
import type { Machine, MachineStatusRecord, Site } from '@/lib/types'

interface DisplayDashboardProps {
  machines: (Machine & { currentStatus: MachineStatusRecord | null })[]
  site: Site | null
  sites: Site[]
}

export function DisplayDashboard({ machines, site, sites }: DisplayDashboardProps) {
  const router = useRouter()
  const [activeWidget, setActiveWidget] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const source = new EventSource('/api/updates')
    const handleUpdate = () => router.refresh()

    source.addEventListener('update', handleUpdate)
    source.onmessage = handleUpdate

    return () => {
      source.close()
    }
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWidget((prev) => (prev + 1) % 3)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const widgets = [
    <WeatherWidget key="weather" />,
    <WebcamWidget key="webcam" />,
    <AnnouncementWidget key="announcement" site={site} />,
  ]

  const onTimeCount = machines.filter((m) => !m.currentStatus || m.currentStatus.status === 'on_time').length
  const delayedCount = machines.filter((m) => m.currentStatus?.status?.startsWith('delayed_')).length
  const downCount = machines.filter((m) => m.currentStatus?.status?.startsWith('down_')).length

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="absolute inset-0 bg-[url('/brand/maps.jpg')] bg-cover bg-center opacity-10" />
      <div className="relative">
        <header className="bg-primary text-primary-foreground px-8 py-4">
          <div className="flex items-center justify-between">
            <TJULogo size="lg" className="[&_span]:text-primary-foreground [&_span]:opacity-90" />
            <div className="text-right">
              <ClockWidget time={currentTime} />
              {site && (
                <p className="text-sm text-primary-foreground/70 mt-1">{site.name}</p>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-foreground">LINAC Machine Status</h2>
                <div className="flex gap-4">
                  <StatusPill label="On Time" count={onTimeCount} colorClass="bg-status-on-time" />
                  <StatusPill label="Delayed" count={delayedCount} colorClass="bg-status-delayed" />
                  <StatusPill label="Down" count={downCount} colorClass="bg-status-down" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {machines.map((machine) => (
                  <MachineStatusCard
                    key={machine.id}
                    machine={machine}
                    canEdit={false}
                  />
                ))}
              </div>

              {machines.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <p className="text-xl text-muted-foreground">No machines configured for this site.</p>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden min-h-[400px] transition-all duration-500">
                {widgets[activeWidget]}
              </div>

              <div className="flex justify-center gap-2">
                {widgets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveWidget(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === activeWidget
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Switch to widget ${index + 1}`}
                  />
                ))}
              </div>

              {sites.length > 1 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-2">Switch Site</p>
                  <div className="flex flex-wrap gap-2">
                    {sites.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => router.push(`/display?site=${s.id}`)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          s.id === site?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {s.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 bg-primary/95 text-primary-foreground py-3 px-8">
          <div className="flex items-center justify-between text-sm">
            <span>Thomas Jefferson University Health System - Department of Radiation Oncology</span>
            <span className="text-primary-foreground/70">
              Last refreshed: {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </footer>
      </div>
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
    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
      <span className={`w-3 h-3 rounded-full ${colorClass}`} />
      <span className="font-medium text-foreground">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
