import React from "react"
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'
import { createClient } from '@/lib/supabase/server'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} profile={profile} canAdmin={canAdmin} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
