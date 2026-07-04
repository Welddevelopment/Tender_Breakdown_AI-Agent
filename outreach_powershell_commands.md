# Bidframe Outreach Sender: PowerShell Commands

Run these from `C:\Users\email\Downloads\HACKATHON 1`.

```powershell
$env:GMAIL_USER = "you@bidframe.org"
$env:GMAIL_APP_PASSWORD = "your-gmail-app-password"

python .\send_outreach.py --dry-run --limit 8

python .\send_outreach.py --delay 120
```

The dry run prints the first 8 READY rows in priority order, which are the Fire first leads in the current CSV. The real send command sends all READY rows, skips `MT-57`, `MT-08`, and `MT-40`, and waits 120 seconds between emails.
