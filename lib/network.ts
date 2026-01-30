export type NetworkKey = 'tju' | 'lvhn'

export const NETWORK_COOKIE_NAME = 'tju-network'

export const NETWORKS: Record<NetworkKey, { label: string; shortLabel: string }> = {
  tju: {
    label: 'Thomas Jefferson University',
    shortLabel: 'Jefferson',
  },
  lvhn: {
    label: 'Lehigh Valley Health Network',
    shortLabel: 'Lehigh Valley',
  },
}

export function normalizeNetwork(value?: string | null): NetworkKey | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized === 'tju') return 'tju'
  if (normalized === 'lvhn') return 'lvhn'
  return null
}

export function getNetworkLabel(network: NetworkKey) {
  return NETWORKS[network]?.shortLabel || network
}
