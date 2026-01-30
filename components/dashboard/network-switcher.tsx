'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NetworkKey } from '@/lib/network'
import { NETWORK_COOKIE_NAME, NETWORKS } from '@/lib/network'
import type { Site } from '@/lib/types'

interface NetworkSwitcherProps {
  activeNetwork: NetworkKey
  networks: NetworkKey[]
  sitesByNetwork: Record<NetworkKey, Site[]>
  disabled?: boolean
  enableRouting?: boolean
  onChange?: (network: NetworkKey) => void
}

export function NetworkSwitcher({
  activeNetwork,
  networks,
  sitesByNetwork,
  disabled = false,
  enableRouting = true,
  onChange,
}: NetworkSwitcherProps) {
  if (networks.length === 0) {
    return null
  }
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    document.cookie = `${NETWORK_COOKIE_NAME}=${activeNetwork}; path=/; max-age=31536000`
  }, [activeNetwork])

  function handleNetworkChange(nextNetwork: NetworkKey) {
    if (disabled || nextNetwork === activeNetwork) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('network', nextNetwork)

    const nextSites = sitesByNetwork[nextNetwork] || []
    if (nextSites.length > 0) {
      params.set('site', nextSites[0].id)
    } else {
      params.delete('site')
    }

    document.cookie = `${NETWORK_COOKIE_NAME}=${nextNetwork}; path=/; max-age=31536000`
    onChange?.(nextNetwork)
    if (enableRouting) {
      router.push(`${pathname}?${params.toString()}`)
      router.refresh()
    }
  }

  return (
    <Tabs value={activeNetwork} onValueChange={(value) => handleNetworkChange(value as NetworkKey)}>
      <TabsList className="bg-muted text-muted-foreground">
        {networks.map((network) => (
          <TabsTrigger key={network} value={network} disabled={disabled}>
            {NETWORKS[network]?.shortLabel || network}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
