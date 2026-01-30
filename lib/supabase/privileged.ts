import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminBypassEnabled } from '@/lib/auth/admin-bypass'

export async function createPrivilegedClient() {
  if (isAdminBypassEnabled()) {
    try {
      return createAdminClient()
    } catch (error) {
      console.error('Admin bypass enabled but service role key is missing.', error)
    }
  }

  return await createClient()
}
