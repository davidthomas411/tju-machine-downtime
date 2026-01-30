import { RealTimeWrapper } from '@/components/dashboard/realtime-wrapper'
import { StaffDashboardTabs } from '@/components/dashboard/staff-dashboard-tabs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'
import { normalizeNetwork, NETWORK_COOKIE_NAME, type NetworkKey } from '@/lib/network'
import { cookies } from 'next/headers'
import type { Machine } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; network?: string }>
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

  const allSites = sites || []
  const profileSite = allSites.find((site) => site.id === profile?.site_id)
  const profileNetwork = normalizeNetwork(profileSite?.network || null)
  const inferredNetwork = (() => {
    const email = user.email?.toLowerCase() || ''
    if (email.includes('lvh') || email.includes('lvhn')) return 'lvhn' as NetworkKey
    return 'tju' as NetworkKey
  })()
  const requestedNetwork = normalizeNetwork(params.network || null)
  const cookieStore = await cookies()
  const cookieNetwork = normalizeNetwork(cookieStore.get(NETWORK_COOKIE_NAME)?.value)

  const activeNetwork: NetworkKey = requestedNetwork || cookieNetwork || profileNetwork || inferredNetwork

  const networks: NetworkKey[] = ['tju', 'lvhn']
  const sitesByNetwork = networks.reduce((acc, network) => {
    acc[network] = allSites.filter((site) => (normalizeNetwork(site.network || null) || 'tju') === network)
    return acc
  }, {} as Record<NetworkKey, typeof allSites>)

  const filteredSites = sitesByNetwork[activeNetwork] || []
  const requestedSiteId = params.site
  const selectedSiteId = (requestedSiteId && filteredSites.some((site) => site.id === requestedSiteId) ? requestedSiteId : undefined)
    || (profile?.site_id && filteredSites.some((site) => site.id === profile.site_id) ? profile.site_id : undefined)
    || filteredSites[0]?.id

  const { data: machinesData } = await supabase
    .from('machines')
    .select(`
      *,
      site:sites(*),
      machine_statuses(*)
    `)
    .eq('is_active', true)
    .order('display_order')
  const machines = (machinesData as (Machine & { machine_statuses?: unknown[] })[]) || []

  const machinesWithStatus = machines?.map((machine) => {
    const rawStatuses = machine.machine_statuses
    const statuses = Array.isArray(rawStatuses)
      ? rawStatuses
      : rawStatuses
        ? [rawStatuses]
        : []
    let latest = statuses[0] || null
    if (statuses.length > 1) {
      latest = statuses.reduce((current, candidate) => {
        const currentTime = current?.updated_at ? new Date(current.updated_at).getTime() : 0
        const candidateTime = candidate?.updated_at ? new Date(candidate.updated_at).getTime() : 0
        return candidateTime >= currentTime ? candidate : current
      }, latest)
    }
    return {
      ...machine,
      currentStatus: latest || null,
    }
  }) || []

  const canSwitchNetworks = networks.length > 1
  const bootstrapEnabled = Boolean(process.env.ADMIN_BOOTSTRAP_CODE)

  return (
    <RealTimeWrapper>
      <StaffDashboardTabs
        machines={machinesWithStatus}
        allSites={allSites}
        activeNetwork={activeNetwork}
        networks={networks}
        sitesByNetwork={sitesByNetwork}
        canSwitchNetworks={canSwitchNetworks}
        selectedSiteId={selectedSiteId}
        canEdit={canEdit}
        canAdmin={canAdmin}
        bootstrapEnabled={bootstrapEnabled}
      />
    </RealTimeWrapper>
  )
}
