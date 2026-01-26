import sqlite3
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    bot_assignments = {
        1: 5,
        2: 6,
        3: 7,
        4: 8,
        5: 9,
        6: 2,
        7: 5,
        8: 3,
    }

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    updated = 0
    for bot_id, creator_id in bot_assignments.items():
        cursor.execute("UPDATE bots SET creator_id = ? WHERE id = ?", (creator_id, bot_id))
        updated += cursor.rowcount

    conn.commit()
    conn.close()
    print(f"Updated bot creator assignments: {updated}")


if __name__ == "__main__":
    main()
