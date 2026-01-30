import React from "react"
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'
import { createClient } from '@/lib/supabase/server'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'
import { cookies } from 'next/headers'
import { NETWORK_COOKIE_NAME, normalizeNetwork } from '@/lib/network'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .eq('id', user.id)
    .single()

  const canAdmin = profile?.role === 'admin' || isAdminBypassEnabled()
  const cookieStore = await cookies()
  const cookieNetwork = normalizeNetwork(cookieStore.get(NETWORK_COOKIE_NAME)?.value)
  const profileNetwork = normalizeNetwork(profile?.site?.network || null)
  const network = cookieNetwork || profileNetwork || 'tju'

  return (
    <div className="min-h-screen bg-background" data-network={network}>
      <DashboardNav user={user} profile={profile} canAdmin={canAdmin} network={network} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
