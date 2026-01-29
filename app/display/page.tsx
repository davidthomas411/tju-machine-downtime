import { DisplayDashboard } from '@/components/display/display-dashboard'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('name')

  const selectedSiteId = params.site || sites?.[0]?.id

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

  const selectedSite = sites?.find((s) => s.id === selectedSiteId)

  return (
    <DisplayDashboard
      machines={machinesWithStatus}
      site={selectedSite || null}
      sites={sites || []}
    />
  )
}
