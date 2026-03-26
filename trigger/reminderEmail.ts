import { logger, schedules } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export const dailyReminder = schedules.task({
  id: "daily-reminder",
  cron: "0 8 * * *", // 8 AM UTC every day
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

    // Group switches by user_id so each person gets one email
    const switchesByUser = switches.reduce<
      Record<string, typeof switches>
    >((acc, sw) => {
      if (!acc[sw.user_id]) acc[sw.user_id] = [];
      acc[sw.user_id].push(sw);
      return acc;
    }, {});

    logger.log(
      `Sending reminders to ${Object.keys(switchesByUser).length} user(s)`
    );

    for (const [userId, userSwitches] of Object.entries(switchesByUser)) {
      // Resolve the user's email via the admin API
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;

      if (!userEmail) {
        logger.warn(`Could not resolve email for user ${userId} — skipping`);
        continue;
      }

      // Filter down to switches the user hasn't checked in on yet today
      const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
      const pendingSwitches: typeof switches = [];

      for (const sw of userSwitches) {
        const { data: checkins } = await supabase
          .from("checkins")
          .select("checked_in_at")
          .eq("switch_id", sw.id)
          .gte("checked_in_at", todayStart.toISOString())
          .limit(1);

        if (!checkins || checkins.length === 0) {
          pendingSwitches.push(sw);
        }
      }

      if (pendingSwitches.length === 0) {
        logger.log(`${userEmail}: all switches already checked in today`);
        continue;
      }

      // Generate a one-click check-in token for each pending switch.
      // Tokens expire 24 hours from now.
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getvigilis.com";
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const switchItems: string[] = [];

      for (const sw of pendingSwitches) {
        const token = randomBytes(32).toString("hex");

        const { error: tokenError } = await supabase
          .from("checkin_tokens")
          .insert({
            switch_id: sw.id,
            user_id: userId,
            token,
            expires_at: expiresAt.toISOString(),
          });

        if (tokenError) {
          logger.warn(`Failed to create token for switch "${sw.name}": ${tokenError.message}`);
          // Fall back to a plain list item with no button
          switchItems.push(
            `<li style="margin-bottom:16px">
              <strong>${sw.name}</strong> — by ${sw.check_in_time} UTC
              (+ ${sw.grace_period_minutes} min grace)
            </li>`
          );
          continue;
        }

        const checkinUrl = `${baseUrl}/api/checkin?token=${token}`;

        switchItems.push(
          `<li style="margin-bottom:16px">
            <strong>${sw.name}</strong> — by ${sw.check_in_time} UTC
            (+ ${sw.grace_period_minutes} min grace)<br/>
            <a href="${checkinUrl}"
               style="display:inline-block;margin-top:8px;padding:8px 18px;background:#ffffff;color:#0e0e0e;font-size:13px;font-weight:500;border-radius:6px;text-decoration:none;">
              I'm okay ✓
            </a>
          </li>`
        );
      }

      const switchList = switchItems.join("");

      const subject =
        pendingSwitches.length === 1
          ? `Reminder: check in for ${pendingSwitches[0].name} today`
          : `Reminder: you have ${pendingSwitches.length} check-ins due today`;

      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Vigilis <alerts@vigilis.app>",
        to: userEmail,
        subject,
        html: `
          <p>Good morning,</p>
          <p>
            Just a friendly nudge — ${
              pendingSwitches.length === 1
                ? "one of your switches needs a check-in today"
                : `${pendingSwitches.length} of your switches need check-ins today`
            }:
          </p>
          <ul style="padding-left:0;list-style:none">${switchList}</ul>
          <p style="color:#888;font-size:13px">
            Clicking "I'm okay" checks you in instantly — no login needed.
            Each link works once and expires after 24 hours.
          </p>
          <p>— Vigilis</p>
        `,
      });

      if (emailError) {
        logger.error(`Failed to send reminder to ${userEmail}`, { emailError });
        continue;
      }

      logger.log(
        `Reminder sent to ${userEmail} — ${pendingSwitches.length} pending switch(es)`
      );
    }
  },
});
