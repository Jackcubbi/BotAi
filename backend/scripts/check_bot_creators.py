import sqlite3
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT b.id, b.name, b.creator_id, u.email, u.full_name
        FROM bots b
        LEFT JOIN users u ON u.id = b.creator_id
        ORDER BY b.id
        """
    )
    rows = cursor.fetchall()

    print(f"Bots total: {len(rows)}")
    for bot_id, name, creator_id, email, full_name in rows:
        creator = full_name or email or f"User #{creator_id}"
        print(f"- Bot #{bot_id}: {name} -> {creator}")

    conn.close()


if __name__ == "__main__":
    main()
