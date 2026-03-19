import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import CreateSwitchForm from './CreateSwitchForm'
import CheckInButton from './CheckInButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: switches } = await supabase
    .from('switches')
    .select('*')
    .order('created_at', { ascending: false })

  const switchIds = (switches ?? []).map((sw) => sw.id)
  const { data: checkins } = switchIds.length
    ? await supabase
        .from('checkins')
        .select('switch_id, checked_in_at')
        .in('switch_id', switchIds)
        .order('checked_in_at', { ascending: false })
    : { data: [] }

  const lastCheckin: Record<string, string> = {}
  for (const c of checkins ?? []) {
    if (!lastCheckin[c.switch_id]) {
      lastCheckin[c.switch_id] = c.checked_in_at
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-[var(--foreground)]/20 px-4 py-2 text-sm text-[var(--foreground)] hover:border-[var(--foreground)]/60"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-[var(--foreground)]/10 p-6 mb-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-1">Signed in as</p>
          <p className="text-[var(--foreground)] font-medium">{user.email}</p>
        </div>

        <CreateSwitchForm />

        <div>
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">Your switches</h2>
          {switches && switches.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {switches.map((sw) => (
                <li
                  key={sw.id}
                  className="rounded-lg border border-[var(--foreground)]/10 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[var(--foreground)]">{sw.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          sw.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-[var(--foreground)]/10 text-[var(--foreground)]/40'
                        }`}
                      >
                        {sw.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <CheckInButton switchId={sw.id} />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--foreground)]/60">{sw.contact_email}</p>
                  <p className="text-sm text-[var(--foreground)]/60">
                    Check-in: {sw.check_in_time}
                  </p>
                  <p className="text-sm text-[var(--foreground)]/60">
                    Grace period: {sw.grace_period_minutes} min
                  </p>
                  <p className="text-sm text-[var(--foreground)]/60">
                    Last check-in:{' '}
                    {lastCheckin[sw.id]
                      ? new Date(lastCheckin[sw.id]).toLocaleString()
                      : 'Never'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--foreground)]/40">No switches yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
