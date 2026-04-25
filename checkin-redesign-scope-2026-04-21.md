---
type: scoping-doc
created: 2026-04-21
status: Ready for Dylan decision — approve scope, then Claude implements
---

# /api/checkin Redesign — Scope Document

## The Problem

The current GET handler at `/api/checkin?token=X` does the full check-in in one step: validates the token, marks it used, inserts a `checkins` row, then redirects.

Mail scanners and link previews (iCloud Mail, Gmail, Outlook SafeLinks) fetch links in emails before the user opens them. That means a scanner clicking the check-in link before the user does will:
1. Mark the token `used`
2. Insert a false check-in
3. Leave the user with a "token already used" error when they actually try to check in

This is a silent reliability failure. Users will think they checked in when they didn't.

---

## The Fix

Split the one-step GET into a two-step flow:

**Step 1 — GET `/api/checkin?token=X`**
- Validate the token (exists, not expired, not used) — read-only, no writes
- If invalid: redirect to `/checkin-confirmed?status=invalid`
- If valid: redirect to `/checkin-confirm?token=X` (new confirm page)

**Step 2 — `/checkin-confirm?token=X` page**
- Simple static page: "You're checking in. Tap below to confirm."
- One button that POSTs to `/api/checkin` with the token in the request body
- Scanners don't submit forms, so this stops false triggers

**Step 3 — POST `/api/checkin`**
- Does the actual work: validate token again (re-check used/expired), mark used, insert checkin, return JSON or redirect to `/checkin-confirmed?status=ok`
- POST-only; GET returns 405

---

## Files Changed

| File | Change |
|---|---|
| `app/api/checkin/route.ts` | Rewrite GET to be read-only (validate + redirect to confirm). Add POST handler for the actual check-in. |
| `app/checkin-confirm/page.tsx` | **New file.** Server component that reads `?token=X` from the URL and renders a confirm button (form POST). |
| `app/checkin-confirmed/page.tsx` | No change — already handles `?status=ok/used/expired/invalid`. |

Email link format stays the same: `/api/checkin?token=X`. No email template changes needed.

---

## Edge Cases

- **Double-click on confirm button:** The POST handler re-validates the token before inserting. If the user somehow submits twice, the second POST sees `used = true` and returns the "already used" status cleanly.
- **Token expired between GET and POST:** Re-validation in the POST handler catches this. User sees the expired page.
- **Scanner fetches the confirm page too:** Scanners fetch links, but they don't submit forms with JavaScript or POST requests. The two-step design stops them here.
- **User has JS disabled:** The confirm page should use a `<form method="POST">` with a submit button — no JS required.

---

## Complexity

**Small-medium.** Two existing files change, one new file created. The new confirm page is straightforward (no auth needed — it just renders a form with the token as a hidden input). Total implementation: 1–2 hours.

**No database schema changes.** The `checkin_tokens` and `checkins` tables stay as-is.

---

## Decision Needed

Approve this scope → Claude implements the 3-file change.

Or flag any constraints (e.g., styling requirements for the confirm page, specific button copy, whether you want JSON vs. redirect response on POST).
