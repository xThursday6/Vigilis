/**
 * Twilio SMS helper. Uses the REST API directly (no SDK) to keep the
 * dependency footprint small. If Twilio env vars are unset, sendSMS returns
 * a structured `skipped` result so the monitor can log and move on rather
 * than crash.
 */

type SendResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string }
  | { ok: false; skipped: true; error: 'twilio_not_configured' }

export function isTwilioConfigured(): boolean {
  return (
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_FROM_NUMBER
  )
}

export async function sendSMS(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!sid || !token || !from) {
    return { ok: false, skipped: true, error: 'twilio_not_configured' }
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body })
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    )

    const data = (await res.json()) as { sid?: string; message?: string; code?: number }

    if (!res.ok) {
      return { ok: false, error: data.message ?? `Twilio error ${res.status}` }
    }
    return { ok: true, providerId: data.sid ?? '' }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown SMS error',
    }
  }
}
