import argparse
import sqlite3

from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def _fetch_duplicate_groups(cursor: sqlite3.Cursor):
    cursor.execute(
        """
        SELECT creator_id, name, COUNT(*) as total
        FROM bots
        GROUP BY creator_id, name
        HAVING COUNT(*) > 1
        ORDER BY total DESC, creator_id ASC, name ASC
        """
    )
    return cursor.fetchall()


def _fetch_ids_for_group(cursor: sqlite3.Cursor, creator_id: int, name: str):
    cursor.execute(
        "SELECT id FROM bots WHERE creator_id = ? AND name = ? ORDER BY id DESC",
        (creator_id, name),
    )
    return [int(row[0]) for row in cursor.fetchall()]


def _merge_related_rows(cursor: sqlite3.Cursor, keep_id: int, old_id: int):
    cursor.execute("UPDATE bot_conversations SET bot_id = ? WHERE bot_id = ?", (keep_id, old_id))

    cursor.execute(
        """
        INSERT OR IGNORE INTO bot_reviews (bot_id, user_id, rating, comment, created_at, updated_at)
        SELECT ?, user_id, rating, comment, created_at, updated_at
        FROM bot_reviews
        WHERE bot_id = ?
        """,
        (keep_id, old_id),
    )
    cursor.execute("DELETE FROM bot_reviews WHERE bot_id = ?", (old_id,))

    cursor.execute(
        """
        INSERT OR IGNORE INTO bot_purchases (bot_id, buyer_id, amount, created_at)
        SELECT ?, buyer_id, amount, created_at
        FROM bot_purchases
        WHERE bot_id = ?
        """,
        (keep_id, old_id),
    )
    cursor.execute("DELETE FROM bot_purchases WHERE bot_id = ?", (old_id,))


def run_dedupe(apply_changes: bool) -> int:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    duplicate_groups = _fetch_duplicate_groups(cursor)
    if not duplicate_groups:
        print("No duplicate bot groups found.")
        conn.close()
        return 0

    total_groups = 0
    total_to_delete = 0
    total_deleted = 0

    print("Duplicate groups by (creator_id, name):")
    for row in duplicate_groups:
        creator_id = int(row["creator_id"])
        name = row["name"]
        ids = _fetch_ids_for_group(cursor, creator_id, name)
        keep_id = ids[0]
        remove_ids = ids[1:]

        total_groups += 1
        total_to_delete += len(remove_ids)

        print(f"- creator_id={creator_id}, name={name}, keep={keep_id}, remove={remove_ids}")

        if apply_changes:
            for old_id in remove_ids:
                _merge_related_rows(cursor, keep_id, old_id)
                cursor.execute("DELETE FROM bots WHERE id = ?", (old_id,))
                total_deleted += cursor.rowcount

    if apply_changes:
        conn.commit()
        print(f"Applied dedupe. Groups: {total_groups}, deleted bots: {total_deleted}")
    else:
        print(f"Dry run only. Groups: {total_groups}, bots to delete: {total_to_delete}")

    conn.close()
    return 0


def parse_args():
    parser = argparse.ArgumentParser(description="Deduplicate marketplace bots by (creator_id, name)")
    parser.add_argument("--apply", action="store_true", help="Apply changes. Without this flag, runs in dry-run mode.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    raise SystemExit(run_dedupe(apply_changes=args.apply))
