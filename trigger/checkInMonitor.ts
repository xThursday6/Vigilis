import { logger, schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sendSMS } from "../utils/sms";
import { escapeHtml } from "../utils/escape";

// Per-run cap on alerts sent per user. With hourly cron, this is effectively
// a per-hour cap — catches runaway switches and abuse without paging legit users.
const MAX_ALERTS_PER_USER_PER_RUN = 50;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

type Contact = {
  id: string
  email: string
  name: string | null
  phone: string | null
}

type AlertInput = {
  switchId: string
  userId: string
  switchName: string
  checkInTime: string
  gracePeriodMinutes: number
  overdueText: string
  personalMessage: string | null
}

async function logDelivery(input: {
  switchId: string
  userId: string
  contactId: string
  channel: "email" | "sms"
  status: "sent" | "failed"
  providerId?: string | null
  recipient: string
  error?: string | null
}) {
  const { error } = await supabase.from("alert_deliveries").insert({
    switch_id: input.switchId,
    user_id: input.userId,
    contact_id: input.contactId,
    channel: input.channel,
    status: input.status,
    provider_id: input.providerId ?? null,
    recipient: input.recipient,
    error: input.error ?? null,
  });
  if (error) {
    logger.error("Failed to write alert_deliveries row", { error, input });
  }
}

function buildEmailHtml(alert: AlertInput, contact: Contact): string {
  // All interpolated values are user-controlled (switch name, personal message,
  // contact name) — escape to prevent HTML injection in the recipient's inbox.
  const switchName = escapeHtml(alert.switchName);
  const greeting = contact.name ? `Hi ${escapeHtml(contact.name)},` : "Hi,";
  const closing = alert.personalMessage
    ? `<p><em>${escapeHtml(alert.personalMessage)}</em></p>`
    : `<p>This is just a heads-up, not an alarm. It may well be nothing. But if you haven't heard from ${switchName} recently, it might be worth a quick message or call.</p>`;

  return `
    <p>${greeting}</p>
    <p>
      This is a quiet note from Vigilis. <strong>${switchName}</strong> was
      due to check in by ${escapeHtml(alert.checkInTime)} UTC today, and the
      ${escapeHtml(alert.gracePeriodMinutes)}-minute grace period has now passed
      — about ${escapeHtml(alert.overdueText)} ago.
    </p>
    ${closing}
    <p>— Vigilis</p>
  `;
}

function buildSmsBody(alert: AlertInput): string {
  // Keep it short — single SMS segment if possible (160 chars).
  return `Vigilis: ${alert.switchName} missed their check-in at ${alert.checkInTime} UTC (${alert.overdueText} overdue). Might be worth a quick message.`;
}

export const checkInMonitor = schedules.task({
  id: "check-in-monitor",
  cron: "0 * * * *", // Every hour on the hour
  maxDuration: 120,
  run: async (payload) => {
    const now = payload.timestamp;

    const { data: switches, error } = await supabase
      .from("switches")
      .select("*")
      .eq("is_active", true);

    if (error) {
      logger.error("Failed to fetch switches", { error });
      return;
    }

    if (!switches || switches.length === 0) {
      logger.log("No active switches found");
      return;
    }

    // Fetch all profiles (plans) for owners of these switches, in one go.
    const ownerIds = Array.from(new Set(switches.map((s) => s.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, plan, subscription_status, subscription_ends_at")
      .in("user_id", ownerIds);

    const planByUser = new Map<string, "free" | "pro">();
    for (const p of profiles ?? []) {
      const expired =
        p.subscription_ends_at &&
        new Date(p.subscription_ends_at) < now &&
        p.subscription_status !== "active";
      planByUser.set(p.user_id, p.plan === "pro" && !expired ? "pro" : "free");
    }

    logger.log(`Checking ${switches.length} active switch(es)`);

    // Per-user counter, reset each run. Prevents a single account with many
    // switches from blasting thousands of emails/SMS in one tick.
    const alertsSentByUser = new Map<string, number>();

    for (const sw of switches) {
      // Build deadline and grace deadline in UTC from check_in_time "HH:MM".
      const [checkHour, checkMinute] = sw.check_in_time.split(":").map(Number);
      const deadline = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          checkHour,
          checkMinute,
          0
        )
      );
      const graceDeadline = new Date(
        deadline.getTime() + Number(sw.grace_period_minutes) * 60 * 1000
      );

      if (now < graceDeadline) {
        logger.log(`Switch "${sw.name}": grace period not yet passed`);
        continue;
      }

      const intervalHours = Number(sw.interval_hours) || 24;
      const intervalMs = intervalHours * 60 * 60 * 1000;

      if (sw.last_alert_sent_at) {
        const lastAlert = new Date(sw.last_alert_sent_at);
        if (now.getTime() - lastAlert.getTime() < intervalMs) {
          logger.log(`Switch "${sw.name}": alert already sent within interval`);
          continue;
        }
      }

      const windowStart = new Date(now.getTime() - intervalMs);
      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("checked_in_at")
        .eq("switch_id", sw.id)
        .gte("checked_in_at", windowStart.toISOString())
        .limit(1);

      if (recentCheckins && recentCheckins.length > 0) {
        logger.log(`Switch "${sw.name}": check-in found within interval`);
        continue;
      }

      // Active contacts for this switch
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, email, name, phone")
        .eq("switch_id", sw.id)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (!contacts || contacts.length === 0) {
        logger.warn(`Switch "${sw.name}" has no active contacts — skipping`);
        continue;
      }

      const alreadySent = alertsSentByUser.get(sw.user_id) ?? 0;
      if (alreadySent >= MAX_ALERTS_PER_USER_PER_RUN) {
        logger.warn(
          `[rate-limit] user ${sw.user_id} hit ${MAX_ALERTS_PER_USER_PER_RUN} alerts this run — skipping "${sw.name}"`
        );
        continue;
      }

      // How overdue is the check-in?
      const overdueMs = now.getTime() - graceDeadline.getTime();
      const overdueMinutes = Math.floor(overdueMs / (1000 * 60));
      const overdueText =
        overdueMinutes >= 60
          ? `${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}m`
          : `${overdueMinutes} minutes`;

      const plan = planByUser.get(sw.user_id) ?? "free";

      const alert: AlertInput = {
        switchId: sw.id,
        userId: sw.user_id,
        switchName: sw.name,
        checkInTime: sw.check_in_time,
        gracePeriodMinutes: sw.grace_period_minutes,
        overdueText,
        personalMessage: sw.personal_message,
      };

      let anySuccess = false;

      for (const contact of contacts as Contact[]) {
        // ── Email ─────────────────────────────────────────────────────
        try {
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "Vigilis <alerts@vigilis.app>",
            to: contact.email,
            subject: `A heads-up about ${sw.name}`,
            html: buildEmailHtml(alert, contact),
          });

          if (emailError) {
            await logDelivery({
              switchId: sw.id,
              userId: sw.user_id,
              contactId: contact.id,
              channel: "email",
              status: "failed",
              recipient: contact.email,
              error: emailError.message,
            });
            logger.error(`Email failed for "${sw.name}" → ${contact.email}`, {
              emailError,
            });
          } else {
            anySuccess = true;
            alertsSentByUser.set(sw.user_id, (alertsSentByUser.get(sw.user_id) ?? 0) + 1);
            await logDelivery({
              switchId: sw.id,
              userId: sw.user_id,
              contactId: contact.id,
              channel: "email",
              status: "sent",
              providerId: emailData?.id ?? null,
              recipient: contact.email,
            });
          }
        } catch (err) {
          await logDelivery({
            switchId: sw.id,
            userId: sw.user_id,
            contactId: contact.id,
            channel: "email",
            status: "failed",
            recipient: contact.email,
            error: err instanceof Error ? err.message : "Unknown email error",
          });
        }

        // ── SMS (Pro only, contact has phone) ─────────────────────────
        if (plan === "pro" && contact.phone) {
          const smsResult = await sendSMS(contact.phone, buildSmsBody(alert));
          if (smsResult.ok) {
            anySuccess = true;
            alertsSentByUser.set(sw.user_id, (alertsSentByUser.get(sw.user_id) ?? 0) + 1);
            await logDelivery({
              switchId: sw.id,
              userId: sw.user_id,
              contactId: contact.id,
              channel: "sms",
              status: "sent",
              providerId: smsResult.providerId,
              recipient: contact.phone,
            });
          } else if (!("skipped" in smsResult)) {
            await logDelivery({
              switchId: sw.id,
              userId: sw.user_id,
              contactId: contact.id,
              channel: "sms",
              status: "failed",
              recipient: contact.phone,
              error: smsResult.error,
            });
          }
          // If skipped due to missing env vars, don't log (nothing was attempted).
        }
      }

      // Only mark alert as "sent" (for cooldown) if at least one channel succeeded.
      // Otherwise we'll retry on the next hourly run.
      if (anySuccess) {
        await supabase
          .from("switches")
          .update({ last_alert_sent_at: now.toISOString() })
          .eq("id", sw.id);
        logger.log(`Alert dispatched for "${sw.name}" (${overdueText} overdue)`);
      } else {
        logger.warn(`No channels succeeded for "${sw.name}" — will retry next run`);
      }
    }
  },
});
