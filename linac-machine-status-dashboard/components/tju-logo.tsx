'use client'

import Image from 'next/image'

const sizeMap = {
  sm: { size: 36, text: 'text-base' },
  md: { size: 48, text: 'text-lg' },
  lg: { size: 64, text: 'text-xl' },
}

export function TJULogo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { size: iconSize, text } = sizeMap[size]

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

export function TJULogoCompact({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/brand/jefferson-university-shield.svg"
      alt="Thomas Jefferson University"
      width={40}
      height={40}
      className={`shrink-0 ${className}`}
    />
  )
}
