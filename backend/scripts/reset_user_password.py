import argparse
import sqlite3

import bcrypt

from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reset password for any user by email")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--password", required=True, help="New plain text password")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    password_hash = bcrypt.hashpw(args.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (password_hash, args.email))
    conn.commit()

    if cursor.rowcount == 0:
        print(f"User not found: {args.email}")
        conn.close()
        return 1

    print(f"Password reset for: {args.email}")
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
