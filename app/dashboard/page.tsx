import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

        <div className="rounded-lg border border-[var(--foreground)]/10 p-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-1">Signed in as</p>
          <p className="text-[var(--foreground)] font-medium">{user.email}</p>
        </div>
      </div>
    </div>
  )
}
