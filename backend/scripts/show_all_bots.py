import sqlite3
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            b.id,
            b.name,
            b.is_public,
            b.price,
            b.category,
            b.creator_id,
            COALESCE(u.full_name, u.email) as creator,
            b.created_at
        FROM bots b
        LEFT JOIN users u ON u.id = b.creator_id
        ORDER BY b.id DESC
        """
    )

    rows = cursor.fetchall()
    print(f"Total bots: {len(rows)}")
    for bot_id, name, is_public, price, category, creator_id, creator, created_at in rows:
        visibility = "public" if is_public else "private"
        print(
            f"- #{bot_id} {name} | {visibility} | ${float(price):.2f} | {category} | "
            f"creator_id={creator_id} ({creator}) | created_at={created_at}"
        )

    conn.close()


if __name__ == "__main__":
    main()
