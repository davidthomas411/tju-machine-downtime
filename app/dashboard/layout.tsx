import React from "react"
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'
import { getBasicAuthUser } from '@/lib/basic-auth-server'
import { getUserById } from '@/lib/actions/users'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const basicUser = getBasicAuthUser()
  if (!basicUser) {
    redirect('/login')
  }

  const profile = await getUserById(basicUser.username)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={basicUser} profile={profile} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
