'use client'

import React from "react"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealTimeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('machine-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machine_statuses',
        },
        () => {
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machines',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  return <>{children}</>
}
