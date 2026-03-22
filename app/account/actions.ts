'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

type Result = { error: string | null; success: boolean }

export async function changePassword(
  _prevState: Result,
  formData: FormData
): Promise<Result> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) {
    return { error: "Passwords don't match.", success: false }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message, success: false }
  return { error: null, success: true }
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Delete all user data before removing the auth record
  const { data: switches } = await supabase
    .from('switches')
    .select('id')
    .eq('user_id', user.id)

  const switchIds = (switches ?? []).map((s) => s.id)

  if (switchIds.length > 0) {
    await supabase.from('checkins').delete().in('switch_id', switchIds)
    await supabase.from('switches').delete().eq('user_id', user.id)
  }

  // Deleting an auth user requires the service-role key
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  redirect('/login')
}
