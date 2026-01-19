import sqlite3
import os
import threading
from config import DATABASE_PATH
from rbac import DEFAULT_ROLES, DEFAULT_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS

# Per-thread connection pool.
# Passenger WSGI + a2wsgi's ThreadPoolExecutor each run in different OS threads.
# A single global connection accessed from multiple threads causes SQLite to
# deadlock/hang even with check_same_thread=False, because the same connection
# object is not safe for truly concurrent use.  threading.local gives every
# thread its own independent connection and eliminates the hang.
_thread_local = threading.local()


def get_db():
    conn = getattr(_thread_local, "connection", None)
    if conn is None:
        database_dir = os.path.dirname(DATABASE_PATH)
        if database_dir:
            os.makedirs(database_dir, exist_ok=True)
        conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False, timeout=5)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout = 3000")
        _thread_local.connection = conn
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # RBAC tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INTEGER NOT NULL,
            role_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id INTEGER,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # User addresses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            address_line1 TEXT NOT NULL,
            address_line2 TEXT,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            zip_code TEXT NOT NULL,
            country TEXT DEFAULT 'USA',
            is_default BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT,
            stock INTEGER DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cart items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
        )
    """)

    # Orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            shipping_address TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Order items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    # Bots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            creator_id INTEGER NOT NULL,
            system_prompt TEXT NOT NULL,
            ai_model TEXT DEFAULT 'gpt-4.1-mini',
            output_mode TEXT DEFAULT 'text',
            temperature REAL DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 500,
            price REAL DEFAULT 0.0,
            is_public BOOLEAN DEFAULT 0,
            avatar_url TEXT,
            welcome_message TEXT,
            fallback_response TEXT DEFAULT 'I am not sure how to respond to that.',
            configuration TEXT DEFAULT '{}',
            total_conversations INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Bot conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Bot messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            tokens_used INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES bot_conversations(id) ON DELETE CASCADE
        )
    """)

    # Bot purchases table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(bot_id, buyer_id)
        )
    """)

    # Bot reviews table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(bot_id, user_id)
        )
    """)

    # Bot categories table (for predefined categories)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bot_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Support conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'open',
            continued_history_id INTEGER,
            last_sender_role TEXT,
            last_read_by_user_at TIMESTAMP,
            last_read_by_admin_at TIMESTAMP,
            last_message_preview TEXT,
            last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (continued_history_id) REFERENCES support_conversation_history(id) ON DELETE SET NULL,
            UNIQUE(user_id)
        )
    """)

    # Support messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Support conversation history table (archived closed chats)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_conversation_id INTEGER,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'closed',
            closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            closed_by INTEGER,
            last_message_preview TEXT,
            last_message_at TIMESTAMP,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            message_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # Support message history table (archived messages)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_message_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            history_id INTEGER NOT NULL,
            sender_id INTEGER,
            sender_role TEXT NOT NULL,
            message TEXT NOT NULL,
            sender_email TEXT,
            sender_full_name TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY (history_id) REFERENCES support_conversation_history(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # Insert default bot categories
    default_categories = [
        ('Customer Support', 'Bots for customer service and support', ''),
        ('Sales & Marketing', 'Bots for lead generation and sales', ''),
        ('Education & Tutoring', 'Bots for teaching and learning', ''),
        ('Personal Assistant', 'Bots for productivity and organization', ''),
        ('Entertainment', 'Fun and engaging bots', ''),
        ('Health & Wellness', 'Bots for health advice and wellness', ''),
        ('Finance', 'Bots for financial advice and planning', ''),
        ('Creative Writing', 'Bots for writing and content creation', ''),
        ('Technical Support', 'Bots for IT and technical help', ''),
        ('Other', 'Miscellaneous bots', '')
    ]

    for cat_name, cat_desc, cat_icon in default_categories:
        cursor.execute(
            "INSERT OR IGNORE INTO bot_categories (name, description, icon) VALUES (?, ?, ?)",
            (cat_name, cat_desc, cat_icon)
        )

    # Seed default roles
    for role_name in DEFAULT_ROLES:
        role_description = role_name.replace("_", " ").title()
        cursor.execute(
            "INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)",
            (role_name, role_description)
        )

    # Seed default permissions
    for permission_name in DEFAULT_PERMISSIONS:
        permission_description = permission_name.replace(".", " ").replace("_", " ").title()
        cursor.execute(
            "INSERT OR IGNORE INTO permissions (name, description) VALUES (?, ?)",
            (permission_name, permission_description)
        )

    # Seed role -> permission mappings
    for role_name, permission_names in DEFAULT_ROLE_PERMISSIONS.items():
        cursor.execute("SELECT id FROM roles WHERE name = ?", (role_name,))
        role_row = cursor.fetchone()
        if not role_row:
            continue
        role_id = role_row["id"]

        for permission_name in permission_names:
            cursor.execute("SELECT id FROM permissions WHERE name = ?", (permission_name,))
            permission_row = cursor.fetchone()
            if not permission_row:
                continue

            cursor.execute(
                "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                (role_id, permission_row["id"])
            )

    # Lightweight schema migrations for existing databases
    cursor.execute("PRAGMA table_info(bots)")
    bot_columns = {row["name"] for row in cursor.fetchall()}

    cursor.execute("PRAGMA table_info(support_conversations)")
    support_conversation_columns = {row["name"] for row in cursor.fetchall()}

    if "continued_history_id" not in support_conversation_columns:
        cursor.execute("ALTER TABLE support_conversations ADD COLUMN continued_history_id INTEGER")

    if "last_sender_role" not in support_conversation_columns:
        cursor.execute("ALTER TABLE support_conversations ADD COLUMN last_sender_role TEXT")

    if "last_read_by_user_at" not in support_conversation_columns:
        cursor.execute("ALTER TABLE support_conversations ADD COLUMN last_read_by_user_at TIMESTAMP")

    if "last_read_by_admin_at" not in support_conversation_columns:
        cursor.execute("ALTER TABLE support_conversations ADD COLUMN last_read_by_admin_at TIMESTAMP")

    if "output_mode" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN output_mode TEXT DEFAULT 'text'")

    if "updated_at" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN updated_at TIMESTAMP")

    if "configuration" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN configuration TEXT DEFAULT '{}'")

    if "avatar_url" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN avatar_url TEXT")

    if "welcome_message" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN welcome_message TEXT")

    if "fallback_response" not in bot_columns:
        cursor.execute("ALTER TABLE bots ADD COLUMN fallback_response TEXT DEFAULT 'I am not sure how to respond to that.'")

    cursor.execute("UPDATE bots SET output_mode = 'text' WHERE output_mode IS NULL OR output_mode = ''")
    cursor.execute("UPDATE bots SET configuration = '{}' WHERE configuration IS NULL OR configuration = ''")
    cursor.execute("UPDATE bots SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL")

    # Ensure every user has at least one role
    cursor.execute("SELECT id, email FROM users")
    users = cursor.fetchall()

    cursor.execute("SELECT id FROM roles WHERE name = 'user'")
    user_role_row = cursor.fetchone()
    user_role_id = user_role_row["id"] if user_role_row else None

    cursor.execute("SELECT id FROM roles WHERE name = 'admin'")
    admin_role_row = cursor.fetchone()
    admin_role_id = admin_role_row["id"] if admin_role_row else None

    cursor.execute("SELECT id FROM roles WHERE name = 'super_admin'")
    super_admin_role_row = cursor.fetchone()
    super_admin_role_id = super_admin_role_row["id"] if super_admin_role_row else None

    for user in users:
        user_id = user["id"]
        email = user["email"] or ""

        cursor.execute("SELECT 1 FROM user_roles WHERE user_id = ? LIMIT 1", (user_id,))
        has_any_role = cursor.fetchone() is not None

        if has_any_role:
            continue

        if user_id == 1 and super_admin_role_id:
            cursor.execute(
                "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
                (user_id, super_admin_role_id)
            )
        elif email.endswith("@admin.com") and admin_role_id:
            cursor.execute(
                "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
                (user_id, admin_role_id)
            )
        elif user_role_id:
            cursor.execute(
                "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
                (user_id, user_role_id)
            )

    # Performance indexes (safe, idempotent)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_conversations_last_message_at ON support_conversations(last_message_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_created_at ON support_messages(conversation_id, created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_sender_created_at ON support_messages(conversation_id, sender_role, created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_history_user_closed_at ON support_conversation_history(user_id, closed_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_message_history_history_created_at ON support_message_history(history_id, created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders(user_id, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bot_conversations_user_bot ON bot_conversations(user_id, bot_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bot_messages_conversation_created_at ON bot_messages(conversation_id, created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created_at ON audit_logs(actor_user_id, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at ON audit_logs(action, created_at DESC)")


    conn.commit()

def close_db():
    conn = getattr(_thread_local, "connection", None)
    if conn:
        conn.close()
        _thread_local.connection = None
