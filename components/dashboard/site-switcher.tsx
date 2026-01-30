'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Site } from '@/lib/types'
import { Building2 } from 'lucide-react'
import { updateDefaultSite } from '@/lib/actions/users'

interface SiteSwitcherProps {
  sites: Site[]
  currentSiteId?: string
  persistSelection?: boolean
  onChange?: (siteId: string) => void
}

export function SiteSwitcher({ sites, currentSiteId, persistSelection = false, onChange }: SiteSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSiteChange(siteId: string) {
    onChange?.(siteId)

    if (!onChange) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('site', siteId)
      router.push(`${pathname}?${params.toString()}`)
    }

    if (persistSelection) {
      startTransition(async () => {
        await updateDefaultSite(siteId)
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-5 w-5 text-muted-foreground" />
      <Select value={currentSiteId} onValueChange={handleSiteChange} disabled={isPending}>
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue placeholder="Select hospital" />
        </SelectTrigger>
        <SelectContent>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
