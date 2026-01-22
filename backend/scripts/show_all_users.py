import sqlite3
from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def main() -> None:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            u.id,
            u.email,
            u.full_name,
            u.created_at,
            COALESCE(GROUP_CONCAT(DISTINCT r.name), '') as roles,
            COUNT(DISTINCT b.id) as bots_total,
            SUM(CASE WHEN b.is_public = 1 THEN 1 ELSE 0 END) as bots_public
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN bots b ON b.creator_id = u.id
        GROUP BY u.id
        ORDER BY u.id DESC
        """
    )

    rows = cursor.fetchall()
    print(f"Total users: {len(rows)}")
    for row in rows:
        full_name = row["full_name"] or "N/A"
        roles = row["roles"] or "none"
        bots_total = int(row["bots_total"] or 0)
        bots_public = int(row["bots_public"] or 0)
        bots_private = bots_total - bots_public

        print(
            f"- #{row['id']} {row['email']} | {full_name} | roles=[{roles}] | "
            f"bots(total={bots_total}, public={bots_public}, private={bots_private}) | "
            f"created_at={row['created_at']}"
        )

    conn.close()


if __name__ == "__main__":
    main()
