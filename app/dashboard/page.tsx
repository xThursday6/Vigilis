import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'
import CreateSwitchForm from './CreateSwitchForm'
import SwitchesList from './SwitchesList'

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
          <div className="flex items-center gap-6">
            <Link
              href="/account"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Account
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
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
            <SwitchesList switches={switches} lastCheckin={lastCheckin} />
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
