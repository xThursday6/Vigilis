import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ChangePasswordForm from './ChangePasswordForm'
import DeleteAccountSection from './DeleteAccountSection'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-white/90 font-medium tracking-tight">Vigilis</span>
          <Link
            href="/dashboard"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-xs text-white/30 mb-10">{user.email}</p>

        {/* Change password */}
        <section className="mb-12">
          <h2 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-5">
            Change password
          </h2>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-6 py-6">
            <ChangePasswordForm />
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-medium tracking-widest uppercase text-red-500/40 mb-5">
            Danger zone
          </h2>
          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] px-6 py-6">
            <DeleteAccountSection />
          </div>
        </section>
      </div>
    </div>
  )
}
