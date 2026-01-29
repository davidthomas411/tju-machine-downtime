'use client'

import React from "react"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RealTimeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const source = new EventSource('/api/updates')
    const handleUpdate = () => router.refresh()

    source.addEventListener('update', handleUpdate)
    source.onmessage = handleUpdate

    return () => {
      source.close()
    }
  }, [router])

  return <>{children}</>
}
