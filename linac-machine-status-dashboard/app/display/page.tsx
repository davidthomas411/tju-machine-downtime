import { DisplayDashboard } from '@/components/display/display-dashboard'
import { getSites } from '@/lib/actions/sites'
import { getMachinesWithStatus } from '@/lib/actions/machines'

export const dynamic = 'force-dynamic'

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>
}) {
  const params = await searchParams

  const sites = await getSites()
  const selectedSiteId = params.site || sites?.[0]?.id

  const machines = await getMachinesWithStatus(selectedSiteId)
  const machinesWithStatus = machines || []

  const selectedSite = sites?.find((s) => s.id === selectedSiteId)

  return (
    <DisplayDashboard
      machines={machinesWithStatus}
      site={selectedSite || null}
      sites={sites || []}
    />
  )
}
