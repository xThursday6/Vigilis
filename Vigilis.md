---
status: active
priority: high
phase: "Phase 4 — Polish + Payments"
stack: Next.js, Supabase, Vercel, Resend, Trigger.dev, Lemon Squeezy
live: https://getvigilis.com
path: /Users/Dylan/Dylan-OS/Projects/Vigilis
last_updated: 2026-04-14
---

# Vigilis

A missed check-in web app for solo travelers and people living alone. If a user doesn't check in on schedule, their trusted contact gets automatically alerted.

## What it does
- User sets a check-in schedule
- If they miss it, a trusted contact is notified
- Calm, quiet, dependable UX — never alarming or fear-based

## Current phase
Phase 4 — Polish + Payments. V1 scope is locked.

## The one metric that matters
% of users still checking in after 30 days.

## Scope rules
V1 scope is locked. Push back on any feature requests outside the core check-in loop.

## Key decisions
- Brand tone: calm, quiet, dependable, human. Never alarming or fear-based.
- Stack chosen for simplicity and low maintenance overhead
- Trigger.dev handles background job scheduling

## Stack
| Layer | Tool |
|---|---|
| Frontend | Next.js |
| Database | Supabase |
| Hosting | Vercel |
| Email | Resend |
| Background jobs | Trigger.dev |
| Payments | Lemon Squeezy |

## Links
- Live: https://getvigilis.com
- Code: [[Projects/Vigilis]]
