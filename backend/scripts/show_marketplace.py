import sqlite3
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT b.id, b.name, b.price, b.category, u.full_name, u.email
        FROM bots b
        JOIN users u ON u.id = b.creator_id
        WHERE b.is_public = 1
        ORDER BY b.id
        """
    )

    rows = cursor.fetchall()
    print(f"Public marketplace bots: {len(rows)}")
    for bot_id, name, price, category, full_name, email in rows:
        creator = full_name or email
        print(f"- #{bot_id} {name} | ${price:.2f} | {category} | by {creator}")

    conn.close()


if __name__ == "__main__":
    main()
