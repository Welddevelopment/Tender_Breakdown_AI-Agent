"""admin.py — command-line account management for the invite-only auth.

There is no public signup: you create accounts for paying customers here.

    python -m app.admin create-user alice@firm.co.uk            # prompts for a password
    python -m app.admin create-user alice@firm.co.uk --password s3cret
    python -m app.admin list-users
    python -m app.admin set-password alice@firm.co.uk --password newpass

Run it from the backend/ directory (so the SQLite path resolves the same as the API),
or point DATABASE_URL at the same DB the server uses.
"""

from __future__ import annotations

import argparse
import getpass
import sqlite3
import sys
import time
import uuid

from . import store
from .auth import hash_password


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _create_user(email: str, password: str) -> int:
    email = email.strip()
    if "@" not in email:
        print(f"error: '{email}' does not look like an email address", file=sys.stderr)
        return 2
    if len(password) < 8:
        print("error: password must be at least 8 characters", file=sys.stderr)
        return 2
    store.init_db()
    try:
        store.create_user(
            user_id=f"usr-{uuid.uuid4().hex[:10]}",
            email=email,
            password_hash=hash_password(password),
            created_at=_now_iso(),
        )
    except sqlite3.IntegrityError:
        print(f"error: an account already exists for {email}", file=sys.stderr)
        return 1
    print(f"created account for {email}")
    return 0


def _set_password(email: str, password: str) -> int:
    if len(password) < 8:
        print("error: password must be at least 8 characters", file=sys.stderr)
        return 2
    store.init_db()
    user = store.get_user_by_email(email)
    if user is None:
        print(f"error: no account for {email}", file=sys.stderr)
        return 1
    with store._conn() as c:  # noqa: SLF001 - internal admin tool, same module family
        c.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(password), user["id"]),
        )
    print(f"password updated for {email}")
    return 0


def _list_users() -> int:
    store.init_db()
    users = store.list_users()
    if not users:
        print("(no accounts yet)")
        return 0
    for u in users:
        print(f"{u['email']:40}  {u['created_at']}  {u['id']}")
    return 0


def _resolve_password(args: argparse.Namespace) -> str:
    if args.password:
        return args.password
    return getpass.getpass("Password: ")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="app.admin", description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_create = sub.add_parser("create-user", help="create a new account")
    p_create.add_argument("email")
    p_create.add_argument("--password", help="omit to be prompted securely")

    p_pw = sub.add_parser("set-password", help="reset an account's password")
    p_pw.add_argument("email")
    p_pw.add_argument("--password", help="omit to be prompted securely")

    sub.add_parser("list-users", help="list all accounts")

    args = parser.parse_args(argv)
    if args.cmd == "create-user":
        return _create_user(args.email, _resolve_password(args))
    if args.cmd == "set-password":
        return _set_password(args.email, _resolve_password(args))
    if args.cmd == "list-users":
        return _list_users()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
