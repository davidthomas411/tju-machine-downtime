'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Site } from '@/lib/types'
import { Building2 } from 'lucide-react'

interface SiteSwitcherProps {
  sites: Site[]
  currentSiteId?: string
}

export function SiteSwitcher({ sites, currentSiteId }: SiteSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  function handleSiteChange(siteId: string) {
    const params = new URLSearchParams()
    params.set('site', siteId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-5 w-5 text-muted-foreground" />
      <Select value={currentSiteId} onValueChange={handleSiteChange}>
        <SelectTrigger className="w-[200px] bg-card">
          <SelectValue placeholder="Select site" />
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
