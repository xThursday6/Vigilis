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
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-white/90 font-medium tracking-tight">Vigilis</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Account */}
        <p className="text-xs text-white/30 mb-10">{user.email}</p>

        {/* Switches */}
        {switches && switches.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-5">
              Your switches
            </h2>
            <ul className="flex flex-col gap-3">
              {switches.map((sw) => (
                <li
                  key={sw.id}
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-5"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium text-white/85">
                        {sw.name}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          sw.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {sw.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <CheckInButton switchId={sw.id} />
                  </div>

                  {/* Details grid */}
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                    <div>
                      <dt className="text-[11px] text-white/30 mb-0.5">Contact</dt>
                      <dd className="text-sm text-white/60 truncate">{sw.contact_email}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-white/30 mb-0.5">Check-in time</dt>
                      <dd className="text-sm text-white/60">{sw.check_in_time} UTC</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-white/30 mb-0.5">Grace period</dt>
                      <dd className="text-sm text-white/60">{sw.grace_period_minutes} min</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-white/30 mb-0.5">Last check-in</dt>
                      <dd className="text-sm text-white/60">
                        {lastCheckin[sw.id]
                          ? new Date(lastCheckin[sw.id]).toLocaleString()
                          : 'Never'}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Create form */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-5">
            {switches && switches.length > 0 ? 'Add a switch' : 'Create your first switch'}
          </h2>
          <CreateSwitchForm />
        </section>
      </div>
    </div>
  )
}
