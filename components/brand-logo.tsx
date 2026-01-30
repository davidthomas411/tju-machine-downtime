'use client'

import Image from 'next/image'
import type { NetworkKey } from '@/lib/network'

const sizeMap = {
  sm: { size: 36, text: 'text-base' },
  md: { size: 52, text: 'text-lg' },
  lg: { size: 72, text: 'text-xl' },
}

interface BrandLogoProps {
  network: NetworkKey
  variant?: 'full' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BrandLogo({
  network,
  variant = 'full',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const { size: iconSize, text } = sizeMap[size]

  if (network === 'lvhn') {
    const logoSrc = '/brand/lehigh-valley-jefferson-health.png'
    const logoAlt = 'Lehigh Valley Health Network, part of Jefferson Health'
    const lvhnCompactSizes = {
      sm: { width: 180, height: 36 },
      md: { width: 220, height: 44 },
      lg: { width: 260, height: 52 },
    }
    const lvhnFullSizes = {
      sm: { width: 220, height: 44 },
      md: { width: 280, height: 56 },
      lg: { width: 340, height: 68 },
    }
    const { width, height } = variant === 'compact'
      ? lvhnCompactSizes[size]
      : lvhnFullSizes[size]

    return (
      <div className={`flex items-center ${className}`}>
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={width}
          height={height}
          className={variant === 'compact' ? 'h-auto w-auto max-h-14' : 'h-auto w-auto max-h-16'}
          priority
        />
      </div>
    )
  }

  if (variant === 'compact') {
    const tjuCompactSizes = {
      sm: { width: 130, height: 36 },
      md: { width: 170, height: 44 },
      lg: { width: 220, height: 56 },
    }
    const { width, height } = tjuCompactSizes[size]
    return (
      <Image
        src="/brand/Blue-TJU_logo.jpg"
        alt="Thomas Jefferson University"
        width={width}
        height={height}
        className={`shrink-0 ${className}`}
      />
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/jefferson-university-shield.svg"
        alt="Thomas Jefferson University"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
      />
      <div className="flex flex-col">
        <span className={`${text} font-semibold text-primary leading-tight`}>Thomas Jefferson University</span>
        <span className="text-sm text-muted-foreground leading-tight">Department of Radiation Oncology</span>
      </div>
    </div>
  )
}
