import { MachineStatusCard } from '@/components/dashboard/machine-status-card'
import { RealTimeWrapper } from '@/components/dashboard/realtime-wrapper'
import { SiteSwitcher } from '@/components/dashboard/site-switcher'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('name')

  const restrictedSiteId = profile?.role !== 'admin' ? profile?.site_id : null
  const selectedSiteId = restrictedSiteId || params.site || sites?.[0]?.id

  let machinesQuery = supabase
    .from('machines')
    .select(`
      *,
      site:sites(*),
      machine_statuses(*)
    `)
    .eq('is_active', true)
    .order('display_order')

  if (selectedSiteId) {
    machinesQuery = machinesQuery.eq('site_id', selectedSiteId)
  }

  const { data: machines } = await machinesQuery

  const machinesWithStatus = machines?.map((machine) => ({
    ...machine,
    currentStatus: machine.machine_statuses?.[0] || null,
  })) || []

  const canEdit = profile?.role === 'admin' || profile?.role === 'staff'
  const selectedSite = sites?.find((s) => s.id === selectedSiteId)
  const canSwitchSites = !restrictedSiteId && sites.length > 1

  return (
    <RealTimeWrapper>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">LINAC Machine Status</h1>
            <p className="text-muted-foreground mt-1">
              {selectedSite?.name || 'All Sites'} - Real-time status updates
            </p>
          </div>

          {canSwitchSites && (
            <SiteSwitcher sites={sites} currentSiteId={selectedSiteId} />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatusSummaryCard
            label="On Time"
            count={machinesWithStatus.filter((m) => m.currentStatus?.status === 'on_time' || !m.currentStatus).length}
            colorClass="bg-status-on-time"
          />
          <StatusSummaryCard
            label="Delayed"
            count={machinesWithStatus.filter((m) => m.currentStatus?.status?.startsWith('delayed_')).length}
            colorClass="bg-status-delayed"
          />
          <StatusSummaryCard
            label="Down"
            count={machinesWithStatus.filter((m) => m.currentStatus?.status?.startsWith('down_')).length}
            colorClass="bg-status-down"
          />
          <StatusSummaryCard
            label="Maintenance"
            count={machinesWithStatus.filter((m) => m.currentStatus?.status === 'maintenance').length}
            colorClass="bg-muted-foreground"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {machinesWithStatus.map((machine) => (
            <MachineStatusCard
              key={machine.id}
              machine={machine}
              canEdit={canEdit}
            />
          ))}
        </div>

        {machinesWithStatus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No machines found for this site.</p>
            {profile?.role === 'admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                Add machines in the Admin panel.
              </p>
            )}
          </div>
        )}
      </div>
    </RealTimeWrapper>
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
