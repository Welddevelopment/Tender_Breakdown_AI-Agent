"""
Safe Gmail sender for Bidframe outreach.

Usage, from Windows PowerShell at the repo root:

  # Set credentials for this PowerShell session only:
  $env:GMAIL_USER = "you@bidframe.org"
  $env:GMAIL_APP_PASSWORD = "your-gmail-app-password"

  # Dry run the first 8 READY rows. Because sending is priority-sorted, these are
  # the Fire first leads unless the CSV changes:
  python .\send_outreach.py --dry-run --limit 8

  # Real send all READY rows, excluding the hard-coded skip list, with 120
  # seconds between emails:
  python .\send_outreach.py --delay 120

Safety notes:
- The script reads bidframe_outreach_mailmerge.csv by default.
- It only sends rows where send_status is READY.
- It always skips MT-57, MT-08, and MT-40.
- It sends in priority order: Fire first, High, Standard.
- It validates recipient email, subject, body, bidframe.org link, and Cal.com
  link before each send.
- It never hardcodes Gmail credentials. Use GMAIL_USER and GMAIL_APP_PASSWORD.
- It appends every sent, dry-run, skipped, or errored row to sent_outreach_log.csv.
"""

from __future__ import annotations

import argparse
import csv
import os
import smtplib
import ssl
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path


DEFAULT_CSV = Path("bidframe_outreach_mailmerge.csv")
DEFAULT_LOG = Path("sent_outreach_log.csv")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
BIDFRAME_LINK = "https://www.bidframe.org"
CAL_LINK = "https://cal.com/joel-jeon-o29lfr/bidframe"
SKIP_LEAD_IDS = {"MT-57", "MT-08", "MT-40"}
PRIORITY_ORDER = {"Fire first": 0, "High": 1, "Standard": 2}
LOG_FIELDS = [
    "timestamp_utc",
    "lead_id",
    "company",
    "email",
    "priority_tier",
    "send_status",
    "result",
    "reason",
    "dry_run",
]


@dataclass(frozen=True)
class OutreachRow:
    sequence: int
    priority_tier: str
    lead_id: str
    company: str
    email: str
    subject: str
    body: str
    send_status: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Safely send Bidframe outreach emails through Gmail SMTP."
    )
    parser.add_argument(
        "--csv",
        default=str(DEFAULT_CSV),
        help=f"Outreach CSV path. Default: {DEFAULT_CSV}",
    )
    parser.add_argument(
        "--log",
        default=str(DEFAULT_LOG),
        help=f"Sent/skipped log CSV path. Default: {DEFAULT_LOG}",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print emails and log DRY_RUN rows, but do not connect to SMTP.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only process the first N READY rows after skip-list and priority sorting.",
    )
    parser.add_argument(
        "--delay",
        type=int,
        default=0,
        help="Seconds to wait between real sent emails. Default: 0.",
    )
    return parser.parse_args()


def clean(value: object) -> str:
    return str(value or "").strip()


def clean_body(value: object) -> str:
    body = clean(value)
    return body.replace("\r\n", "\n").replace("\r", "\n")


def load_rows(csv_path: Path) -> list[OutreachRow]:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {
            "priority_tier",
            "lead_id",
            "company",
            "email",
            "subject",
            "body",
            "send_status",
        }
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

        rows = []
        for index, row in enumerate(reader):
            rows.append(
                OutreachRow(
                    sequence=index,
                    priority_tier=clean(row.get("priority_tier")),
                    lead_id=clean(row.get("lead_id")),
                    company=clean(row.get("company")),
                    email=clean(row.get("email")),
                    subject=clean(row.get("subject")),
                    body=clean_body(row.get("body")),
                    send_status=clean(row.get("send_status")),
                )
            )
        return rows


def sort_key(row: OutreachRow) -> tuple[int, int]:
    return (PRIORITY_ORDER.get(row.priority_tier, 99), row.sequence)


def append_log(log_path: Path, row: OutreachRow, result: str, reason: str, dry_run: bool) -> None:
    log_exists = log_path.exists()
    with log_path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=LOG_FIELDS)
        if not log_exists:
            writer.writeheader()
        writer.writerow(
            {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "lead_id": row.lead_id,
                "company": row.company,
                "email": row.email,
                "priority_tier": row.priority_tier,
                "send_status": row.send_status,
                "result": result,
                "reason": reason,
                "dry_run": "yes" if dry_run else "no",
            }
        )


def validate_row(row: OutreachRow) -> list[str]:
    errors = []
    if not row.email or "@" not in row.email:
        errors.append("missing or invalid recipient email")
    if not row.subject:
        errors.append("missing subject")
    if not row.body:
        errors.append("missing body")
    if BIDFRAME_LINK not in row.body:
        errors.append(f"missing {BIDFRAME_LINK} link")
    if CAL_LINK not in row.body:
        errors.append(f"missing {CAL_LINK} link")
    return errors


def build_message(row: OutreachRow, gmail_user: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = gmail_user
    message["To"] = row.email
    message["Subject"] = row.subject
    message.set_content(row.body)
    return message


def print_email(row: OutreachRow) -> None:
    print("=" * 72)
    print(f"{row.lead_id} | {row.priority_tier} | {row.company}")
    print(f"To: {row.email}")
    print(f"Subject: {row.subject}")
    print("-" * 72)
    print(row.body)
    print("=" * 72)


def connect_smtp(gmail_user: str, app_password: str) -> smtplib.SMTP:
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=60)
    server.ehlo()
    server.starttls(context=ssl.create_default_context())
    server.ehlo()
    server.login(gmail_user, app_password)
    return server


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv)
    log_path = Path(args.log)

    if args.limit is not None and args.limit < 1:
        print("--limit must be a positive integer.", file=sys.stderr)
        return 2
    if args.delay < 0:
        print("--delay cannot be negative.", file=sys.stderr)
        return 2

    try:
        rows = load_rows(csv_path)
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Loaded {len(rows)} rows from {csv_path}")
    print(f"Mode: {'DRY RUN - no emails will be sent' if args.dry_run else 'REAL SEND'}")

    skipped_before_limit = 0
    candidates = []
    for row in sorted(rows, key=sort_key):
        if row.lead_id in SKIP_LEAD_IDS:
            reason = "hard-coded skip list"
            print(f"SKIP {row.lead_id}: {reason}")
            append_log(log_path, row, "SKIPPED", reason, args.dry_run)
            skipped_before_limit += 1
            continue
        if row.send_status.upper() != "READY":
            reason = f"send_status is {row.send_status or 'blank'}, not READY"
            print(f"SKIP {row.lead_id}: {reason}")
            append_log(log_path, row, "SKIPPED", reason, args.dry_run)
            skipped_before_limit += 1
            continue
        candidates.append(row)

    if args.limit is not None:
        candidates = candidates[: args.limit]
        print(f"Limit applied: processing first {len(candidates)} READY candidate row(s).")

    if not candidates:
        print("No READY candidate rows to process.")
        print(f"Log written to {log_path}")
        return 0

    gmail_user = clean(os.environ.get("GMAIL_USER"))
    app_password = clean(os.environ.get("GMAIL_APP_PASSWORD"))
    server: smtplib.SMTP | None = None

    if not args.dry_run:
        if not gmail_user:
            print("ERROR: GMAIL_USER is not set.", file=sys.stderr)
            return 1
        if not app_password:
            print("ERROR: GMAIL_APP_PASSWORD is not set.", file=sys.stderr)
            return 1
        try:
            server = connect_smtp(gmail_user, app_password)
        except smtplib.SMTPException as exc:
            print(f"ERROR: Could not connect/login to Gmail SMTP: {exc}", file=sys.stderr)
            return 1

    sent_or_dry_run = 0
    skipped_validation = 0
    errors = 0

    try:
        for index, row in enumerate(candidates, start=1):
            validation_errors = validate_row(row)
            if validation_errors:
                reason = "; ".join(validation_errors)
                print(f"SKIP {row.lead_id}: {reason}")
                append_log(log_path, row, "SKIPPED", reason, args.dry_run)
                skipped_validation += 1
                continue

            if args.dry_run:
                print(f"DRY RUN {row.lead_id}: would send to {row.email}")
                print_email(row)
                append_log(log_path, row, "DRY_RUN", "validated; not sent", True)
                sent_or_dry_run += 1
                continue

            assert server is not None
            try:
                server.send_message(build_message(row, gmail_user))
            except smtplib.SMTPException as exc:
                reason = f"SMTP error: {exc}"
                print(f"ERROR {row.lead_id}: {reason}")
                append_log(log_path, row, "ERROR", reason, False)
                errors += 1
                continue

            print(f"SENT {row.lead_id}: {row.company} <{row.email}>")
            append_log(log_path, row, "SENT", "sent via Gmail SMTP", False)
            sent_or_dry_run += 1

            if args.delay and index < len(candidates):
                print(f"Waiting {args.delay} seconds before the next email...")
                time.sleep(args.delay)
    finally:
        if server is not None:
            server.quit()

    print("-" * 72)
    print(
        "Summary: "
        f"{sent_or_dry_run} {'validated in dry run' if args.dry_run else 'sent'}, "
        f"{skipped_validation + skipped_before_limit} skipped, "
        f"{errors} errors."
    )
    print(f"Log written to {log_path}")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
