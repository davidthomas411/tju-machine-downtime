import { RealTimeWrapper } from '@/components/dashboard/realtime-wrapper'
import { StaffDashboardTabs } from '@/components/dashboard/staff-dashboard-tabs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'

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

  const allowViewerAdmin = isAdminBypassEnabled()
  const canAdmin = profile?.role === 'admin' || allowViewerAdmin
  const canEdit = canAdmin || profile?.role === 'staff'
  const restrictedSiteId = canAdmin ? null : profile?.site_id
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

  const canSwitchSites = !restrictedSiteId && sites.length > 1
  const bootstrapEnabled = Boolean(process.env.ADMIN_BOOTSTRAP_CODE)

  return (
    <RealTimeWrapper>
      <StaffDashboardTabs
        machines={machinesWithStatus}
        sites={sites || []}
        selectedSiteId={selectedSiteId}
        canSwitchSites={canSwitchSites}
        canEdit={canEdit}
        canAdmin={canAdmin}
        bootstrapEnabled={bootstrapEnabled}
      />
    </RealTimeWrapper>
  )
}
