'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function bootstrapAdmin(code: string) {
  const bootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE
  if (!bootstrapCode) {
    return { error: 'Admin bootstrap is not configured.' }
  }

  if (code.trim() !== bootstrapCode) {
    return { error: 'Invalid setup code.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be signed in to claim admin.' }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' }
  }

  const adminClient = createAdminClient()
  const { data: admins, error: adminCheckError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)

  if (adminCheckError) {
    return { error: adminCheckError.message }
  }

  if (admins && admins.length > 0) {
    return { error: 'An admin already exists. Ask them to update your role.' }
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/admin')
  return { success: true }
}
