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
        SELECT u.id, u.email, u.full_name, COALESCE(GROUP_CONCAT(r.name, ', '), '') as roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        GROUP BY u.id
        ORDER BY u.id
        """
    )
    users = cursor.fetchall()

    print(f"Total users: {len(users)}")
    for row in users:
        print(f"- #{row['id']} {row['email']} ({row['full_name'] or 'No Name'}) roles=[{row['roles'] or 'none'}]")

    conn.close()


if __name__ == "__main__":
    main()
