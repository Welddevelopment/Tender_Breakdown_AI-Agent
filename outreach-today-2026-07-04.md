# Outreach Today - 4 July 2026

Goal: use the demo while it is fresh. Send a tight batch, not a blast.

## What Already Exists

- `bidframe_outreach_mailmerge.csv`: 39 polished MT leads; 36 are `READY`, 3 are `VERIFY_FIRST`.
- `outreach-priority-ranking.md`: ranked MT send order.
- `crm/sendable-list-2026-07-04.csv`: 50 additional sendable CRM leads, with `email_subject`, `personalised_email`, and notes.
- `crm/drafts/L-0425.md` through `crm/drafts/L-0474.md`: matching draft files for the new 50-lead batch.
- `send_outreach.py`: safe Gmail SMTP sender for `bidframe_outreach_mailmerge.csv`.

## Send Order

1. Send the MT Fire-first leads from `outreach-priority-ranking.md`.
2. Send the MT High leads.
3. Send the 50 new CRM leads from `crm/sendable-list-2026-07-04.csv`, sorted by `conversion_estimate`.
4. Skip `MT-57`, `MT-08`, and `MT-40` unless manually verified.

## Fire-First MT Leads

These are the best reply odds:

1. MT-87 ISCA Heating & Plumbing
2. MT-58 Rooftec Scotland
3. MT-03 Exjet
4. MT-12 Charles Walker Construction
5. MT-114 Brimstone Energy
6. MT-20 Headcorn Heating
7. MT-63 Newseal
8. MT-89 A T Plumbing
9. MT-94 RenderRight
10. MT-80 Environmental Solutions Midlands
11. MT-107 B L Fire Risk
12. MT-113 Solar Partner
13. MT-112 SUS Energy

## PowerShell For Existing Mailmerge

```powershell
cd "C:\Users\email\Downloads\HACKATHON 1"
$env:GMAIL_USER = "you@bidframe.org"
$env:GMAIL_APP_PASSWORD = "your-gmail-app-password"

python .\send_outreach.py --dry-run --limit 13
python .\send_outreach.py --delay 120
```

Note: `send_outreach.py` reads `bidframe_outreach_mailmerge.csv`, sends only `READY`, and always skips `MT-57`, `MT-08`, and `MT-40`.

## Manual Send For New 50 CRM Leads

Use `crm/sendable-list-2026-07-04.csv`.

Important: the July 4 CSV includes migrated versions of some MT leads. Do not send the same company twice.
If a firm appears in both `bidframe_outreach_mailmerge.csv` and `crm/sendable-list-2026-07-04.csv`, treat the
MT send as canonical and mark/skip the duplicate CRM row.

Columns:

- `email`
- `email_subject`
- `personalised_email`
- `personalisation_note`
- `draft_path`

Before each send:

1. Check email is present.
2. Check subject is present.
3. Check body includes `https://cal.com/joel-jeon-o29lfr/bidframe`.
4. Add `https://www.bidframe.org/showcase` if the body does not already include a product link.
5. Do not over-edit urgency. Keep it calm.

## Recommended Extra Line For Today

Add this near the end when appropriate:

"If helpful, I can run one tender through the worked example before we speak, so the call is about your document rather than a generic demo."

## Quick Duplicate Check

Run this before sending the July 4 CRM batch:

```powershell
cd "C:\Users\email\Downloads\HACKATHON 1"
$mt = Import-Csv .\bidframe_outreach_mailmerge.csv
$crm = Import-Csv .\crm\sendable-list-2026-07-04.csv
$mtEmails = @{}
$mt | ForEach-Object { $mtEmails[$_.email.ToLowerInvariant()] = $_.lead_id }
$crm | Where-Object { $mtEmails.ContainsKey($_.email.ToLowerInvariant()) } |
  Select-Object id, firm, email, @{Name="mt_id"; Expression={ $mtEmails[$_.email.ToLowerInvariant()] }}
```

Any rows printed there are not "new" sends. Use the MT version or skip the CRM duplicate.

## Reply Handling

If anyone replies with a tender:

1. Tell J immediately.
2. Save the PDF outside git-tracked files.
3. Run or pre-bake it before the call if possible.
4. Reply with a short confirmation, not a long pitch.

Suggested reply:

"Thanks, got it. I will read through this with Bidframe before our call and use it as the walkthrough, so we can focus on the actual pass/fail lines in your tender."

## Things Not To Do

- Do not send `VERIFY_FIRST` leads without checking them.
- Do not invent a named contact.
- Do not say "100 percent accurate."
- Do not attach the deck unless asked.
- Do not send in one burst; use the 120-second delay or manual spacing.
