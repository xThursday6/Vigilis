'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

type SwitchState = { error: string | null }

export async function createSwitch(
  _prevState: SwitchState,
  formData: FormData
): Promise<SwitchState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const gracePeriod = parseInt(formData.get('grace_period_minutes') as string, 10)

  const { error } = await supabase.from('switches').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    contact_email: formData.get('contact_email') as string,
    check_in_time: formData.get('check_in_time') as string,
    grace_period_minutes: isNaN(gracePeriod) ? 60 : gracePeriod,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}
