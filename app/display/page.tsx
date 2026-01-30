import { DisplayDashboard } from '@/components/display/display-dashboard'
import { normalizeNetwork } from '@/lib/network'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; network?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    : { data: null }

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('name')

  const requestedNetwork = normalizeNetwork(params.network)
  const inferredNetwork = (() => {
    const email = user?.email?.toLowerCase() || ''
    if (email.includes('lvh') || email.includes('lvhn')) return 'lvhn'
    return 'tju'
  })()
  let selectedSite = params.site ? sites?.find((site) => site.id === params.site) : undefined
  const profileSite = profile?.site_id
    ? sites?.find((site) => site.id === profile.site_id)
    : undefined

  if (!selectedSite && requestedNetwork) {
    const networkSites = sites?.filter((site) => normalizeNetwork(site.network) === requestedNetwork) || []
    selectedSite = networkSites.find((site) => site.id === profileSite?.id) || networkSites[0]
  }

  if (!selectedSite) {
    const fallbackNetwork = normalizeNetwork(profileSite?.network || null) || inferredNetwork
    const networkSites = sites?.filter((site) => normalizeNetwork(site.network) === fallbackNetwork) || []
    selectedSite = profileSite || networkSites[0] || sites?.[0]
  }

  const selectedSiteId = selectedSite?.id

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

  return (
    <DisplayDashboard
      machines={machinesWithStatus}
      site={selectedSite || null}
      sites={sites || []}
    />
  )
}
