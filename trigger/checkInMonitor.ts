import { logger, schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export const checkInMonitor = schedules.task({
  id: "check-in-monitor",
  cron: "0 * * * *", // Every hour on the hour
  maxDuration: 120,
  run: async (payload) => {
    const now = payload.timestamp;
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD in UTC

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

    logger.log(`Checking ${switches.length} active switch(es)`);

    for (const sw of switches) {
      // Build deadline and grace deadline in UTC from check_in_time "HH:MM".
      // Use Date.UTC with numeric components instead of string interpolation
      // so that format variations in check_in_time never produce Invalid Date.
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

      // Grace period hasn't elapsed yet — nothing to do
      if (now < graceDeadline) {
        logger.log(`Switch "${sw.name}": grace period not yet passed`);
        continue;
      }

      // Already sent an alert today — don't repeat
      if (sw.last_alert_sent_at) {
        const lastAlertDay = new Date(sw.last_alert_sent_at)
          .toISOString()
          .split("T")[0];
        if (lastAlertDay === todayStr) {
          logger.log(`Switch "${sw.name}": alert already sent today`);
          continue;
        }
      }

      // Check whether the user has checked in at any point today
      const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const { data: recentCheckins } = await supabase
        .from("checkins")
        .select("checked_in_at")
        .eq("switch_id", sw.id)
        .gte("checked_in_at", todayStart.toISOString())
        .limit(1);

      if (recentCheckins && recentCheckins.length > 0) {
        logger.log(`Switch "${sw.name}": check-in confirmed today`);
        continue;
      }

      // How overdue is the check-in?
      const overdueMs = now.getTime() - graceDeadline.getTime();
      const overdueMinutes = Math.floor(overdueMs / (1000 * 60));
      const overdueText =
        overdueMinutes >= 60
          ? `${Math.floor(overdueMinutes / 60)}h ${overdueMinutes % 60}m`
          : `${overdueMinutes} minutes`;

      // Send a calm alert to the trusted contact
      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Vigilis <alerts@vigilis.app>",
        to: sw.contact_email,
        subject: `A heads-up about ${sw.name}`,
        html: `
          <p>Hi,</p>
          <p>
            This is a quiet note from Vigilis. The daily check-in for
            <strong>${sw.name}</strong> was due at ${sw.check_in_time} UTC today,
            and the ${sw.grace_period_minutes}-minute grace period has now passed
            — about ${overdueText} ago.
          </p>
          <p>
            This is just a heads-up, not an alarm. It may well be nothing.
            But if you haven't heard from them recently, it might be worth
            a quick message or call.
          </p>
          <p>— Vigilis</p>
        `,
      });

      if (emailError) {
        logger.error(`Failed to send alert for switch "${sw.name}"`, {
          emailError,
        });
        continue;
      }

      // Record that we've alerted today so subsequent hourly runs stay quiet
      await supabase
        .from("switches")
        .update({ last_alert_sent_at: now.toISOString() })
        .eq("id", sw.id);

      logger.log(
        `Alert sent for switch "${sw.name}" → ${sw.contact_email} (${overdueText} overdue)`
      );
    }
  },
});
