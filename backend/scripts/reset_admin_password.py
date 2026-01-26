import sqlite3
import bcrypt
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    email = "admin@admin.com"
    new_password = "admin123"

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (password_hash, email))
    conn.commit()

    if cursor.rowcount == 0:
        print(f"User not found: {email}")
    else:
        print(f"Password reset for: {email}")

    conn.close()


if __name__ == "__main__":
    main()
