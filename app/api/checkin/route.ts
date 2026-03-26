import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role so the token lookup and check-in insert work
// without requiring the user to be logged in at the time of the click.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/checkin-confirmed?status=invalid', request.url))
  }

  // Look up the token
  const { data: record, error } = await supabase
    .from('checkin_tokens')
    .select('id, switch_id, user_id, used, expires_at')
    .eq('token', token)
    .single()

  if (error || !record) {
    return NextResponse.redirect(new URL('/checkin-confirmed?status=invalid', request.url))
  }

  if (record.used) {
    return NextResponse.redirect(new URL('/checkin-confirmed?status=used', request.url))
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/checkin-confirmed?status=expired', request.url))
  }

  // Mark token as used
  await supabase
    .from('checkin_tokens')
    .update({ used: true })
    .eq('id', record.id)

  // Record the check-in
  await supabase.from('checkins').insert({
    switch_id: record.switch_id,
    user_id: record.user_id,
    checked_in_at: new Date().toISOString(),
  })

  return NextResponse.redirect(new URL('/checkin-confirmed?status=ok', request.url))
}
