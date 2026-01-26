from _bootstrap import add_backend_to_path

add_backend_to_path()

from database import get_db


def main() -> None:
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_subcategories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES bot_categories(id) ON DELETE CASCADE,
            UNIQUE(name, category_id)
        )
        """
    )

    conn.commit()
    print("bot_subcategories table ensured")


if __name__ == "__main__":
    main()
