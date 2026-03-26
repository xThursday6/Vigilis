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
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#eeeee9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[#1a1a17] font-semibold tracking-tight">Vigilis</span>
          <Link
            href="/dashboard"
            className="text-sm text-[#9e9e92] hover:text-[#1a1a17] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-xs text-[#b0b0a4] mb-10">{user.email}</p>

        {/* Change password */}
        <section className="mb-12">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#b0b0a4] mb-5">
            Change password
          </h2>
          <div className="rounded-2xl border border-[#e6e6df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-6 py-7">
            <ChangePasswordForm />
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-red-400/70 mb-5">
            Danger zone
          </h2>
          <div className="rounded-2xl border border-red-100 bg-[#fff8f8] px-6 py-7">
            <DeleteAccountSection />
          </div>
        </section>
      </div>
    </div>
  )
}
