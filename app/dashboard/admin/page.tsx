import { redirect } from 'next/navigation'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { getBasicAuthUser } from '@/lib/basic-auth-server'
import { getUserById, getUsers } from '@/lib/actions/users'
import { getSites } from '@/lib/actions/sites'
import { getMachines } from '@/lib/actions/machines'

export default async function AdminPage() {
  const basicUser = await getBasicAuthUser()
  if (!basicUser) {
    redirect('/login')
  }

  const profile = await getUserById(basicUser.username)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const [sites, machines, users] = await Promise.all([
    getSites(),
    getMachines(),
    getUsers(),
  ])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          Manage sites, machines, and user access
        </p>
      </div>

      <AdminTabs
        sites={sites || []}
        machines={machines || []}
        users={users || []}
      />
    </div>
  )
}
