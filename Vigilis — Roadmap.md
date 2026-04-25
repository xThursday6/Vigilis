---
project: Vigilis
type: roadmap
version: 1.0
created: 2026-04-13
updated: 2026-04-14
tags:
  - roadmap
  - status
---

# Vigilis — Roadmap & Status

> Live tracker. Update this file as milestones are hit.
> V1 scope is locked. One metric: % of users checking in after 30 days.

---

> **Current Phase:** Phase 4 — Polish + Payments
> *(Update this line when you move to the next phase)*

---

## Current Month Focus

*(Update monthly)*

- Complete payment integration
- Polish UI and email templates
- Final QA pass before launch

---

## Key Links

| Asset | URL |
|---|---|
| Live site | https://getvigilis.com |
| Supabase project | — |
| Vercel deployment | — |
| Trigger.dev dashboard | — |
| Resend dashboard | — |
| Lemon Squeezy dashboard | — |

---

## Strategic Priorities

1. Finish Phase 4 (polish + payments) before any scope expansion
2. Launch to real users and collect the one metric: 30-day check-in retention
3. Only add features after seeing real user behavior post-launch
4. Keep the brand tone: calm, quiet, dependable — never alarming

---

## Phase 1 — Core Infrastructure ✓

> **Goal:** Project scaffolded, stack wired up, database schema in place.

- [x] Next.js project initialized
- [x] Supabase project created and connected
- [x] Auth flow working (sign up, sign in, session handling)
- [x] Database schema designed and applied
- [x] Vercel deployment configured
- [x] Environment variables set up across local + prod

---

## Phase 2 — Check-in System ✓

> **Goal:** Users can create a check-in schedule and the system detects missed check-ins.

- [x] Check-in schedule creation UI built
- [x] Trigger.dev integrated for background job scheduling
- [x] Missed check-in detection logic working
- [x] Check-in confirmation flow working
- [x] Schedule timezone handling confirmed

---

## Phase 3 — Alert System ✓

> **Goal:** Trusted contacts get notified when a check-in is missed.

- [x] Trusted contact setup flow built
- [x] Resend integrated for email alerts
- [x] Alert email template written and tested
- [x] Alert timing and escalation logic confirmed
- [x] End-to-end flow tested (miss check-in → alert sent)

---

## Phase 4 — Polish + Payments

> **Goal:** Product is launch-ready. Payments work. UI is clean and reliable.

### Payments

- [x] Lemon Squeezy application approved
- [ ] Subscription plan(s) defined and configured in Lemon Squeezy
- [ ] Checkout flow working end-to-end
- [ ] Post-payment user state handled correctly (plan activated)
- [ ] Payment failure and cancellation states handled
- [ ] Free tier / trial logic confirmed (if applicable)

### UI Polish

- [ ] Mobile responsiveness checked across key screens
- [ ] Loading states added where missing
- [ ] Error states handled gracefully (network failures, timeouts)
- [ ] Empty states designed for new users
- [ ] Typography and spacing pass
- [ ] Dark/light mode consistent (if applicable)

### Email Polish

- [ ] All transactional email templates reviewed and polished
- [ ] Alert email tested across major email clients
- [ ] Unsubscribe / notification preference handling confirmed

### QA

- [ ] End-to-end flow tested: sign up → set schedule → miss → alert sent
- [ ] Payment flow tested in Stripe test mode
- [ ] Edge cases tested (timezone changes, contact email invalid, duplicate check-ins)
- [ ] Production environment tested (not just local)

### Notes

-

---

## Phase 5 — Launch + Growth

> **Goal:** Real users are using Vigilis. Retention signal is being tracked.

### Pre-Launch

- [ ] Landing page copy reviewed and tightened
- [ ] SEO basics in place (title, description, OG tags)
- [ ] Analytics / event tracking set up (PostHog, Plausible, or similar)
- [ ] Onboarding flow smooth for a brand-new user with no context
- [ ] Support email or contact method in place

### Launch

- [ ] ProductHunt launch drafted and scheduled
- [ ] Social posts prepared
- [ ] Personal outreach to first users done
- [ ] Launch day monitoring confirmed (Vercel, Supabase, Trigger.dev)

### Post-Launch Tracking

- [ ] 30-day retention metric baseline established
- [ ] First 10 users onboarded
- [ ] First round of feedback collected
- [ ] Any critical bugs from real usage fixed
- [ ] Conversion rate from landing page visit → sign up tracked

### Notes

-

---

## Ongoing Checklist

- [ ] Check Trigger.dev job queue for failures
- [ ] Check Resend delivery rates
- [ ] Review any error logs in Vercel or Supabase
- [ ] Note any user feedback or edge cases encountered

---

## Retention Log

| Week | Active Users | 30-Day Check-in Rate | Notes |
|---|---:|---:|---|
| — | — | — | — |
