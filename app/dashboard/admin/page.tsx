import { redirect } from 'next/navigation'
import { AdminTabs } from '@/components/admin/admin-tabs'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .order('name')

  const { data: machines } = await supabase
    .from('machines')
    .select('*, site:sites(*)')
    .order('display_order')

  const { data: users } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .order('full_name')

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
