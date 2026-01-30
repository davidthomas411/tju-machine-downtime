'use client'

import { useState } from 'react'
import { AlertTriangle, Activity, BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SiteSwitcher } from '@/components/dashboard/site-switcher'
import { AdminBootstrap } from '@/components/dashboard/admin-bootstrap'
import { MachineStatusCard } from '@/components/dashboard/machine-status-card'
import { StatisticsTab } from '@/components/dashboard/statistics-tab'
import { NetworkSwitcher } from '@/components/dashboard/network-switcher'
import type { Machine, MachineStatusRecord, Site } from '@/lib/types'
import type { NetworkKey } from '@/lib/network'

interface StaffDashboardTabsProps {
  machines: (Machine & { currentStatus: MachineStatusRecord | null })[]
  sites: Site[]
  allSites: Site[]
  activeNetwork: NetworkKey
  networks: NetworkKey[]
  sitesByNetwork: Record<NetworkKey, Site[]>
  canSwitchNetworks: boolean
  selectedSiteId?: string | null
  canSwitchSites: boolean
  canEdit: boolean
  canAdmin: boolean
  bootstrapEnabled: boolean
}

export function StaffDashboardTabs({
  machines,
  sites,
  allSites,
  activeNetwork,
  networks,
  sitesByNetwork,
  canSwitchNetworks,
  selectedSiteId,
  canSwitchSites,
  canEdit,
  canAdmin,
  bootstrapEnabled,
}: StaffDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('status')

  const onTimeCount = machines.filter((m) => m.currentStatus?.status === 'on_time' || !m.currentStatus).length
  const delayedCount = machines.filter((m) => m.currentStatus?.status?.startsWith('delayed_')).length
  const downCount = machines.filter((m) => m.currentStatus?.status?.startsWith('down_')).length
  const maintenanceCount = machines.filter((m) => m.currentStatus?.status === 'maintenance').length

  return (
    <div className="p-6 lg:p-8" data-network={activeNetwork}>
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">LINAC Status Console</h1>
          <p className="text-muted-foreground mt-1">
            {(allSites.find((s) => s.id === selectedSiteId)?.name) || 'All Sites'} · Staff can update machine status in real time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NetworkSwitcher
            activeNetwork={activeNetwork}
            networks={networks}
            sitesByNetwork={sitesByNetwork}
            disabled={!canSwitchNetworks}
          />
          {canSwitchSites && (
            <SiteSwitcher
              sites={sites}
              currentSiteId={selectedSiteId || undefined}
              persistSelection
            />
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {!canEdit && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Viewer access</AlertTitle>
              <AlertDescription>
                Your account can view status only. Ask an admin to set your profile role to
                <span className="font-medium text-amber-950"> staff</span> or
                <span className="font-medium text-amber-950"> admin</span> in Supabase.
              </AlertDescription>
            </Alert>
          )}

          {!canAdmin && (
            <AdminBootstrap enabled={bootstrapEnabled} />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusSummaryCard label="On Time" count={onTimeCount} colorClass="bg-status-on-time" />
            <StatusSummaryCard label="Delayed" count={delayedCount} colorClass="bg-status-delayed" />
            <StatusSummaryCard label="Down" count={downCount} colorClass="bg-status-down" />
            <StatusSummaryCard label="Maintenance" count={maintenanceCount} colorClass="bg-muted-foreground" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {machines.map((machine) => (
              <MachineStatusCard
                key={machine.id}
                machine={machine}
                canEdit={canEdit}
              />
            ))}
          </div>

          {machines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No machines found for this site.</p>
              {canAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add machines in the Admin panel.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsTab siteId={selectedSiteId} machines={machines} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatusSummaryCard({
  label,
  count,
  colorClass,
}: {
  label: string
  count: number
  colorClass: string
}) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground mt-2">{count}</p>
    </div>
  )
}
