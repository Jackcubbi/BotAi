from database import get_db
import bcrypt
import sqlite3
from typing import Optional, List, Dict, Any
import json
import base64
import hashlib
from cryptography.fernet import Fernet
from config import JWT_SECRET


def _get_fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(JWT_SECRET.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt_api_key(api_key: str) -> str:
    return _get_fernet().encrypt(api_key.encode("utf-8")).decode("utf-8")


def _decrypt_api_key(encrypted_api_key: str) -> Optional[str]:
    try:
        return _get_fernet().decrypt(encrypted_api_key.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def _parse_configuration(config_value: Any) -> Dict[str, Any]:
    if not config_value:
        return {}

    if isinstance(config_value, dict):
        return config_value

    try:
        parsed = json.loads(config_value)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _prepare_configuration_for_storage(configuration: Optional[Dict[str, Any]], existing_configuration: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    existing = dict(existing_configuration or {})
    incoming = dict(configuration or {})
    merged = {**existing, **incoming}

    if "ai_api_key" in incoming:
        raw_api_key = (incoming.get("ai_api_key") or "").strip()
        if raw_api_key:
            merged["ai_api_key_encrypted"] = _encrypt_api_key(raw_api_key)
        merged.pop("ai_api_key", None)

    return merged


def _sanitize_configuration_for_response(configuration: Dict[str, Any], include_secrets: bool = False) -> Dict[str, Any]:
    config = dict(configuration or {})

    encrypted_api_key = config.get("ai_api_key_encrypted")
    has_api_key = bool(encrypted_api_key)

    if include_secrets and encrypted_api_key:
        decrypted = _decrypt_api_key(encrypted_api_key)
        if decrypted:
            config["ai_api_key"] = decrypted

    config["has_ai_api_key"] = has_api_key
    config.pop("ai_api_key_encrypted", None)

    if not include_secrets:
        config.pop("ai_api_key", None)

    return config

class UserModel:
    @staticmethod
    def create(email: str, password: str, full_name: Optional[str] = None) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        try:
            cursor.execute(
                "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
                (email, password_hash, full_name)
            )
            user_id = cursor.lastrowid

            cursor.execute("SELECT id FROM roles WHERE name = 'user'")
            user_role = cursor.fetchone()
            if not user_role:
                conn.rollback()
                return None

            cursor.execute(
                "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
                (user_id, user_role["id"])
            )

            conn.commit()
            return user_id
        except Exception:
            conn.rollback()
            return None

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None

        user = dict(row)
        user["roles"] = RoleModel.get_user_roles(user_id)
        return user

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    def count() -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        return cursor.fetchone()["count"]

    @staticmethod
    def get_all(limit: int = 50, offset: int = 0, search: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        if search:
            cursor.execute(
                """SELECT id, email, full_name, created_at FROM users
                   WHERE email LIKE ? OR full_name LIKE ?
                   ORDER BY created_at DESC LIMIT ? OFFSET ?""",
                (f"%{search}%", f"%{search}%", limit, offset)
            )
        else:
            cursor.execute(
                "SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )

        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_user_stats(user_id: int) -> Dict[str, Any]:
        """Get user statistics including bot counts"""
        conn = get_db()
        cursor = conn.cursor()

        # Count bots created by user
        cursor.execute("SELECT COUNT(*) as count FROM bots WHERE creator_id = ?", (user_id,))
        total_bots = cursor.fetchone()["count"]

        # Count public bots
        cursor.execute("SELECT COUNT(*) as count FROM bots WHERE creator_id = ? AND is_public = 1", (user_id,))
        public_bots = cursor.fetchone()["count"]

        # Count purchases made by user
        cursor.execute("SELECT COUNT(*) as count FROM bot_purchases WHERE buyer_id = ?", (user_id,))
        purchases = cursor.fetchone()["count"]

        # Count conversations
        cursor.execute("SELECT COUNT(*) as count FROM bot_conversations WHERE user_id = ?", (user_id,))
        conversations = cursor.fetchone()["count"]

        return {
            "total_bots": total_bots,
            "public_bots": public_bots,
            "purchases": purchases,
            "conversations": conversations
        }

    @staticmethod
    def update(user_id: int, full_name: Optional[str] = None, email: Optional[str] = None) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        if full_name is not None:
            updates.append("full_name = ?")
            params.append(full_name)
        if email is not None:
            updates.append("email = ?")
            params.append(email)

        if not updates:
            return False

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()

        return cursor.rowcount > 0

    @staticmethod
    def delete(user_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0


class RoleModel:
    @staticmethod
    def get_roles() -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, description, created_at FROM roles ORDER BY id ASC")
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_user_roles(user_id: int) -> List[str]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT r.name
               FROM user_roles ur
               JOIN roles r ON r.id = ur.role_id
               WHERE ur.user_id = ?
               ORDER BY r.id ASC""",
            (user_id,)
        )
        return [row["name"] for row in cursor.fetchall()]

    @staticmethod
    def assign_role(user_id: int, role_name: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM roles WHERE name = ?", (role_name,))
        role = cursor.fetchone()
        if not role:
            return False

        cursor.execute(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
            (user_id, role["id"])
        )
        conn.commit()
        return True

    @staticmethod
    def set_single_role(user_id: int, role_name: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM roles WHERE name = ?", (role_name,))
        role = cursor.fetchone()
        if not role:
            return False

        cursor.execute("DELETE FROM user_roles WHERE user_id = ?", (user_id,))
        cursor.execute(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
            (user_id, role["id"])
        )
        conn.commit()
        return True

    @staticmethod
    def user_has_permission(user_id: int, permission_name: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT 1
               FROM user_roles ur
               JOIN role_permissions rp ON rp.role_id = ur.role_id
               JOIN permissions p ON p.id = rp.permission_id
               WHERE ur.user_id = ? AND p.name = ?
               LIMIT 1""",
            (user_id, permission_name)
        )
        return cursor.fetchone() is not None


class AuditLogModel:
    @staticmethod
    def create(actor_user_id: int, action: str, resource_type: str, resource_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        try:
            details_json = json.dumps(details or {})
            cursor.execute(
                """INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, details)
                   VALUES (?, ?, ?, ?, ?)""",
                (actor_user_id, action, resource_type, resource_id, details_json)
            )
            conn.commit()
            return True
        except Exception:
            return False

    @staticmethod
    def list_recent(limit: int = 100, actor_user_id: Optional[int] = None, action: Optional[str] = None) -> List[Dict[str, Any]]:
        result = AuditLogModel.list_paginated(
            page=1,
            limit=limit,
            actor_user_id=actor_user_id,
            action=action,
        )
        return result["logs"]

    @staticmethod
    def list_paginated(
        page: int = 1,
        limit: int = 100,
        actor_user_id: Optional[int] = None,
        action: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        conn = get_db()
        cursor = conn.cursor()

        offset = max(page - 1, 0) * limit
        where = " WHERE 1=1"
        params: List[Any] = []

        if actor_user_id is not None:
            where += " AND l.actor_user_id = ?"
            params.append(actor_user_id)

        if action:
            where += " AND l.action = ?"
            params.append(action)

        if from_date:
            where += " AND l.created_at >= ?"
            params.append(from_date.strip())

        if to_date:
            where += " AND l.created_at <= ?"
            params.append(f"{to_date.strip()} 23:59:59")

        count_query = f"SELECT COUNT(*) as total FROM audit_logs l {where}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        query = f"""
            SELECT l.*, u.email AS actor_email, u.full_name AS actor_full_name
            FROM audit_logs l
            LEFT JOIN users u ON u.id = l.actor_user_id
            {where}
            ORDER BY l.created_at DESC, l.id DESC
            LIMIT ? OFFSET ?
        """

        query_params = [*params, limit, offset]
        cursor.execute(query, query_params)
        rows = [dict(row) for row in cursor.fetchall()]

        for row in rows:
            details_raw = row.get("details")
            if details_raw:
                try:
                    row["details"] = json.loads(details_raw)
                except Exception:
                    row["details"] = {"raw": details_raw}
            else:
                row["details"] = {}

        return {
            "logs": rows,
            "total": total,
            "page": page,
            "limit": limit,
        }

class ProductModel:
    @staticmethod
    def create(name: str, description: str, price: float, category: str, stock: int, image_url: str) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO products (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)",
            (name, description, price, category, stock, image_url)
        )
        conn.commit()
        return cursor.lastrowid

    @staticmethod
    def get_all(limit: int = 50, offset: int = 0, category: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        if category:
            cursor.execute(
                "SELECT * FROM products WHERE category = ? ORDER BY id DESC LIMIT ? OFFSET ?",
                (category, limit, offset)
            )
        else:
            cursor.execute("SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))

        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(product_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def count(category: Optional[str] = None) -> int:
        conn = get_db()
        cursor = conn.cursor()

        if category:
            cursor.execute("SELECT COUNT(*) as count FROM products WHERE category = ?", (category,))
        else:
            cursor.execute("SELECT COUNT(*) as count FROM products")

        return cursor.fetchone()["count"]

    @staticmethod
    def update(product_id: int, name: str, description: str, price: float, category: str, stock: int, image_url: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE products
               SET name = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ?
               WHERE id = ?""",
            (name, description, price, category, stock, image_url, product_id)
        )
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def delete(product_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def get_low_stock(threshold: int = 10) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM products WHERE stock < ?", (threshold,))
        return cursor.fetchone()["count"]

class CartModel:
    @staticmethod
    def add_item(user_id: int, product_id: int, quantity: int = 1) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """INSERT INTO cart_items (user_id, product_id, quantity)
                   VALUES (?, ?, ?)
                   ON CONFLICT(user_id, product_id)
                   DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP""",
                (user_id, product_id, quantity, quantity)
            )
            conn.commit()
            return True
        except Exception:
            return False

    @staticmethod
    def get_cart(user_id: int) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT c.id, c.product_id, c.quantity, c.created_at, c.updated_at,
                      p.name, p.description, p.price, p.category, p.image_url, p.stock
               FROM cart_items c
               JOIN products p ON c.product_id = p.id
               WHERE c.user_id = ?""",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def update_quantity(user_id: int, product_id: int, quantity: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        if quantity <= 0:
            return CartModel.remove_item(user_id, product_id)

        cursor.execute(
            "UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?",
            (quantity, user_id, product_id)
        )
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def remove_item(user_id: int, product_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", (user_id, product_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def clear_cart(user_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))
        conn.commit()
        return True

class OrderModel:
    @staticmethod
    def create(user_id: int, total_amount: float, shipping_address: str, items: List[Dict[str, Any]]) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)",
                (user_id, total_amount, shipping_address, "pending")
            )
            order_id = cursor.lastrowid

            for item in items:
                cursor.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                    (order_id, item["product_id"], item["quantity"], item["price"])
                )

            conn.commit()
            return order_id
        except Exception:
            conn.rollback()
            return None

    @staticmethod
    def get_by_user(user_id: int) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(order_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM orders WHERE id = ? AND user_id = ?",
            (order_id, user_id)
        )
        row = cursor.fetchone()

        if not row:
            return None

        order = dict(row)

        cursor.execute(
            """SELECT oi.*, p.name, p.image_url
               FROM order_items oi
               JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ?""",
            (order_id,)
        )
        order["items"] = [dict(item) for item in cursor.fetchall()]

        return order

    @staticmethod
    def count_all() -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM orders")
        return cursor.fetchone()["count"]


class BotModel:
    @staticmethod
    def _normalize_bot_record(bot: Dict[str, Any]) -> Dict[str, Any]:
        normalized = dict(bot)
        normalized["name"] = normalized.get("name") or ""
        normalized["description"] = normalized.get("description") or ""
        normalized["category"] = normalized.get("category") or "Other"
        normalized["system_prompt"] = normalized.get("system_prompt") or ""
        normalized["ai_model"] = normalized.get("ai_model") or "gpt-4.1-mini"
        normalized["output_mode"] = normalized.get("output_mode") or "text"
        normalized["temperature"] = float(normalized.get("temperature") or 0.7)
        normalized["max_tokens"] = int(normalized.get("max_tokens") or 500)
        normalized["price"] = float(normalized.get("price") or 0.0)
        normalized["is_public"] = bool(normalized.get("is_public"))
        normalized["total_conversations"] = int(normalized.get("total_conversations") or 0)
        normalized["created_at"] = str(normalized.get("created_at") or "")
        normalized["updated_at"] = str(normalized.get("updated_at") or normalized["created_at"])
        return normalized

    @staticmethod
    def create(
        name: str,
        description: str,
        category: str,
        creator_id: int,
        system_prompt: str,
        ai_model: str = "gpt-4.1-mini",
        output_mode: str = "text",
        temperature: float = 0.7,
        max_tokens: int = 500,
        price: float = 0.0,
        is_public: bool = False,
        avatar_url: Optional[str] = None,
        welcome_message: Optional[str] = None,
        fallback_response: Optional[str] = None,
        configuration: Optional[Dict[str, Any]] = None
    ) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        config_payload = _prepare_configuration_for_storage(configuration)
        config_json = json.dumps(config_payload)

        try:
            cursor.execute(
                """INSERT INTO bots (
                    name, description, category, creator_id, system_prompt, ai_model,
                    output_mode,
                    temperature, max_tokens, price, is_public, avatar_url,
                    welcome_message, fallback_response, configuration
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (name, description, category, creator_id, system_prompt, ai_model,
                 output_mode,
                 temperature, max_tokens, price, is_public, avatar_url,
                 welcome_message, fallback_response, config_json)
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating bot: {e}")
            return None

    @staticmethod
    def get_by_id(bot_id: int, include_secrets: bool = False) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bots WHERE id = ?", (bot_id,))
        row = cursor.fetchone()

        if not row:
            return None

        bot = BotModel._normalize_bot_record(dict(row))
        parsed_configuration = _parse_configuration(bot.get("configuration"))
        bot["configuration"] = _sanitize_configuration_for_response(parsed_configuration, include_secrets=include_secrets)
        return bot

    @staticmethod
    def get_all(
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None,
        creator_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        query = "SELECT * FROM bots WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if creator_id is not None:
            query += " AND creator_id = ?"
            params.append(creator_id)

        if is_public is not None:
            query += " AND is_public = ?"
            params.append(1 if is_public else 0)

        if search:
            query += " AND (name LIKE ? OR description LIKE ?)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)

        bots = []
        for row in cursor.fetchall():
            bot = BotModel._normalize_bot_record(dict(row))
            parsed_configuration = _parse_configuration(bot.get("configuration"))
            bot["configuration"] = _sanitize_configuration_for_response(parsed_configuration, include_secrets=False)
            bots.append(bot)

        return bots

    @staticmethod
    def get_marketplace_fast(
        limit: int = 20,
        offset: int = 0,
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        query = "SELECT * FROM bots WHERE is_public = 1"
        params: List[Any] = []

        if category:
            query += " AND category = ?"
            params.append(category)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)

        bots = []
        for row in cursor.fetchall():
            bot = BotModel._normalize_bot_record(dict(row))
            parsed_configuration = _parse_configuration(bot.get("configuration"))
            bot["configuration"] = _sanitize_configuration_for_response(parsed_configuration, include_secrets=False)
            bots.append(bot)

        return bots

    @staticmethod
    def update_by_creator(
        bot_id: int,
        creator_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        system_prompt: Optional[str] = None,
        ai_model: Optional[str] = None,
        output_mode: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        price: Optional[float] = None,
        is_public: Optional[bool] = None,
        avatar_url: Optional[str] = None,
        welcome_message: Optional[str] = None,
        fallback_response: Optional[str] = None,
        configuration: Optional[Dict[str, Any]] = None
    ) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        if system_prompt is not None:
            updates.append("system_prompt = ?")
            params.append(system_prompt)
        if ai_model is not None:
            updates.append("ai_model = ?")
            params.append(ai_model)
        if output_mode is not None:
            updates.append("output_mode = ?")
            params.append(output_mode)
        if temperature is not None:
            updates.append("temperature = ?")
            params.append(temperature)
        if max_tokens is not None:
            updates.append("max_tokens = ?")
            params.append(max_tokens)
        if price is not None:
            updates.append("price = ?")
            params.append(price)
        if is_public is not None:
            updates.append("is_public = ?")
            params.append(1 if is_public else 0)
        if avatar_url is not None:
            updates.append("avatar_url = ?")
            params.append(avatar_url)
        if welcome_message is not None:
            updates.append("welcome_message = ?")
            params.append(welcome_message)
        if fallback_response is not None:
            updates.append("fallback_response = ?")
            params.append(fallback_response)
        if configuration is not None:
            cursor.execute("SELECT configuration FROM bots WHERE id = ? AND creator_id = ?", (bot_id, creator_id))
            existing_row = cursor.fetchone()
            existing_configuration = _parse_configuration(existing_row["configuration"]) if existing_row else {}
            config_payload = _prepare_configuration_for_storage(configuration, existing_configuration)
            updates.append("configuration = ?")
            params.append(json.dumps(config_payload))

        if not updates:
            return False

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.extend([bot_id, creator_id])

        query = f"UPDATE bots SET {', '.join(updates)} WHERE id = ? AND creator_id = ?"
        cursor.execute(query, params)
        conn.commit()

        return cursor.rowcount > 0

    @staticmethod
    def delete_by_creator(bot_id: int, creator_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bots WHERE id = ? AND creator_id = ?", (bot_id, creator_id))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def count(category: Optional[str] = None, is_public: Optional[bool] = None, search: Optional[str] = None) -> int:
        conn = get_db()
        cursor = conn.cursor()

        query = "SELECT COUNT(*) as count FROM bots WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if is_public is not None:
            query += " AND is_public = ?"
            params.append(1 if is_public else 0)

        if search:
            query += " AND (name LIKE ? OR description LIKE ?)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])

        cursor.execute(query, params)
        return cursor.fetchone()["count"]

    @staticmethod
    def update(bot_id: int, **kwargs) -> bool:
        """Update bot fields (admin override - no creator_id check)"""
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        allowed_fields = [
            'name', 'description', 'category', 'system_prompt', 'ai_model',
            'output_mode',
            'temperature', 'max_tokens', 'price', 'is_public', 'avatar_url',
            'welcome_message', 'fallback_response', 'configuration'
        ]

        for field, value in kwargs.items():
            if field in allowed_fields and value is not None:
                if field == 'is_public':
                    updates.append(f"{field} = ?")
                    params.append(1 if value else 0)
                elif field == 'configuration':
                    import json
                    updates.append(f"{field} = ?")
                    params.append(json.dumps(value))
                else:
                    updates.append(f"{field} = ?")
                    params.append(value)

        if not updates:
            return False

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(bot_id)

        query = f"UPDATE bots SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()

        return cursor.rowcount > 0

    @staticmethod
    def delete(bot_id: int) -> bool:
        """Delete bot (admin override - no creator_id check)"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bots WHERE id = ?", (bot_id,))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def get_bot_stats(bot_id: int) -> Dict[str, Any]:
        """Get comprehensive statistics for a bot"""
        conn = get_db()
        cursor = conn.cursor()

        # Get conversation count
        cursor.execute(
            "SELECT COUNT(*) as count FROM bot_conversations WHERE bot_id = ?",
            (bot_id,)
        )
        total_conversations = cursor.fetchone()["count"]

        # Get review stats
        cursor.execute(
            """SELECT
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating
            FROM bot_reviews
            WHERE bot_id = ?""",
            (bot_id,)
        )
        review_stats = cursor.fetchone()
        total_reviews = review_stats["total_reviews"] or 0
        average_rating = review_stats["average_rating"] or 0.0

        # Get purchase count
        cursor.execute(
            "SELECT COUNT(*) as count FROM bot_purchases WHERE bot_id = ?",
            (bot_id,)
        )
        total_purchases = cursor.fetchone()["count"]

        return {
            "total_conversations": total_conversations,
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 2),
            "total_purchases": total_purchases
        }

    @staticmethod
    def increment_usage(bot_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE bots SET total_conversations = total_conversations + 1 WHERE id = ?",
            (bot_id,)
        )
        conn.commit()
        return cursor.rowcount > 0


class BotConversationModel:
    @staticmethod
    def create(bot_id: int, user_id: int) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO bot_conversations (bot_id, user_id) VALUES (?, ?)",
                (bot_id, user_id)
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating conversation: {e}")
            return None

    @staticmethod
    def get_by_id(conversation_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bot_conversations WHERE id = ?", (conversation_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_user(user_id: int, bot_id: Optional[int] = None) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        if bot_id:
            cursor.execute(
                """SELECT bc.*, b.name as bot_name, b.avatar_url
                   FROM bot_conversations bc
                   JOIN bots b ON bc.bot_id = b.id
                   WHERE bc.user_id = ? AND bc.bot_id = ?
                   ORDER BY bc.updated_at DESC""",
                (user_id, bot_id)
            )
        else:
            cursor.execute(
                """SELECT bc.*, b.name as bot_name, b.avatar_url
                   FROM bot_conversations bc
                   JOIN bots b ON bc.bot_id = b.id
                   WHERE bc.user_id = ?
                   ORDER BY bc.updated_at DESC""",
                (user_id,)
            )

        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def update_timestamp(conversation_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE bot_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (conversation_id,)
        )
        conn.commit()
        return cursor.rowcount > 0


class BotMessageModel:
    @staticmethod
    def create(
        conversation_id: int,
        role: str,
        content: str,
        tokens_used: Optional[int] = None
    ) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO bot_messages (conversation_id, role, content, tokens_used) VALUES (?, ?, ?, ?)",
                (conversation_id, role, content, tokens_used)
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating message: {e}")
            return None

    @staticmethod
    def get_by_conversation(conversation_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT * FROM bot_messages
               WHERE conversation_id = ?
               ORDER BY created_at ASC
               LIMIT ?""",
            (conversation_id, limit)
        )
        return [dict(row) for row in cursor.fetchall()]


class BotPurchaseModel:
    @staticmethod
    def create(bot_id: int, buyer_id: int, amount: float) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                "INSERT INTO bot_purchases (bot_id, buyer_id, amount) VALUES (?, ?, ?)",
                (bot_id, buyer_id, amount)
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating purchase: {e}")
            return None

    @staticmethod
    def has_purchased(bot_id: int, user_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) as count FROM bot_purchases WHERE bot_id = ? AND buyer_id = ?",
            (bot_id, user_id)
        )
        return cursor.fetchone()["count"] > 0

    @staticmethod
    def get_by_user(user_id: int) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT bp.*, b.name, b.description, b.avatar_url
               FROM bot_purchases bp
               JOIN bots b ON bp.bot_id = b.id
               WHERE bp.buyer_id = ?
               ORDER BY bp.created_at DESC""",
            (user_id,)
        )
        return [dict(row) for row in cursor.fetchall()]


class BotReviewModel:
    @staticmethod
    def create(bot_id: int, user_id: int, rating: int, comment: Optional[str] = None) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """INSERT INTO bot_reviews (bot_id, user_id, rating, comment)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(bot_id, user_id)
                   DO UPDATE SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP""",
                (bot_id, user_id, rating, comment, rating, comment)
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating review: {e}")
            return None

    @staticmethod
    def get_by_bot(bot_id: int) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """SELECT br.*, u.full_name, u.email
                   FROM bot_reviews br
                   JOIN users u ON br.user_id = u.id
                   WHERE br.bot_id = ?
                   ORDER BY br.created_at DESC""",
                (bot_id,)
            )
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error reading bot reviews: {e}")
            return []

    @staticmethod
    def get_average_rating(bot_id: int) -> float:
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT AVG(rating) as avg_rating FROM bot_reviews WHERE bot_id = ?",
                (bot_id,)
            )
            result = cursor.fetchone()
            return round(result["avg_rating"], 2) if result and result["avg_rating"] else 0.0
        except Exception as e:
            print(f"Error reading average rating: {e}")
            return 0.0

    @staticmethod
    def get_rating_stats_for_bots(bot_ids: List[int]) -> Dict[int, Dict[str, float]]:
        if not bot_ids:
            return {}

        conn = get_db()
        cursor = conn.cursor()
        try:
            placeholders = ",".join(["?"] * len(bot_ids))
            cursor.execute(
                f"""
                SELECT bot_id, COUNT(*) as total_reviews, AVG(rating) as avg_rating
                FROM bot_reviews
                WHERE bot_id IN ({placeholders})
                GROUP BY bot_id
                """,
                bot_ids,
            )

            stats: Dict[int, Dict[str, float]] = {}
            for row in cursor.fetchall():
                stats[int(row["bot_id"])] = {
                    "total_reviews": float(row["total_reviews"] or 0),
                    "average_rating": float(round(row["avg_rating"], 2) if row["avg_rating"] else 0.0),
                }
            return stats
        except Exception as e:
            print(f"Error reading bulk bot review stats: {e}")
            return {}


class BotCategoryModel:
    @staticmethod
    def get_all():
        """Get all bot categories with subcategory counts"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                c.id,
                c.name,
                c.description,
                c.icon,
                c.created_at,
                COUNT(DISTINCT s.id) as subcategory_count,
                COUNT(DISTINCT b.id) as bot_count
            FROM bot_categories c
            LEFT JOIN bot_subcategories s ON c.id = s.category_id
            LEFT JOIN bots b ON c.name = b.category
            GROUP BY c.id
            ORDER BY c.name
        """)
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(category_id: int):
        """Get a category by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM bot_categories WHERE id = ?",
            (category_id,)
        )
        result = cursor.fetchone()
        return dict(result) if result else None

    @staticmethod
    def create(name: str, description: str = None, icon: str = None):
        """Create a new category"""
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO bot_categories (name, description, icon) VALUES (?, ?, ?)",
                (name, description, icon)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    @staticmethod
    def update(category_id: int, name: str = None, description: str = None, icon: str = None):
        """Update a category"""
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if icon is not None:
            updates.append("icon = ?")
            params.append(icon)

        if not updates:
            return False

        params.append(category_id)

        try:
            cursor.execute(
                f"UPDATE bot_categories SET {', '.join(updates)} WHERE id = ?",
                params
            )
            conn.commit()
            return cursor.rowcount > 0
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def delete(category_id: int):
        """Delete a category (will cascade delete subcategories)"""
        conn = get_db()
        cursor = conn.cursor()

        # Check if any bots use this category
        cursor.execute(
            "SELECT COUNT(*) as count FROM bots WHERE category = (SELECT name FROM bot_categories WHERE id = ?)",
            (category_id,)
        )
        result = cursor.fetchone()
        if result["count"] > 0:
            return {"success": False, "error": "Cannot delete category with associated bots"}

        cursor.execute("DELETE FROM bot_categories WHERE id = ?", (category_id,))
        conn.commit()
        return {"success": cursor.rowcount > 0}

    @staticmethod
    def get_with_subcategories(category_id: int = None):
        """Get categories with their subcategories"""
        conn = get_db()
        cursor = conn.cursor()

        if category_id:
            cursor.execute("""
                SELECT
                    c.id,
                    c.name,
                    c.description,
                    c.icon,
                    c.created_at,
                    s.id as subcategory_id,
                    s.name as subcategory_name,
                    s.description as subcategory_description,
                    s.created_at as subcategory_created_at
                FROM bot_categories c
                LEFT JOIN bot_subcategories s ON c.id = s.category_id
                WHERE c.id = ?
                ORDER BY s.name
            """, (category_id,))
        else:
            cursor.execute("""
                SELECT
                    c.id,
                    c.name,
                    c.description,
                    c.icon,
                    c.created_at,
                    s.id as subcategory_id,
                    s.name as subcategory_name,
                    s.description as subcategory_description,
                    s.created_at as subcategory_created_at
                FROM bot_categories c
                LEFT JOIN bot_subcategories s ON c.id = s.category_id
                ORDER BY c.name, s.name
            """)

        rows = cursor.fetchall()

        # Group subcategories under categories
        categories_dict = {}
        for row in rows:
            cat_id = row["id"]
            if cat_id not in categories_dict:
                categories_dict[cat_id] = {
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "icon": row["icon"],
                    "created_at": row["created_at"],
                    "subcategories": []
                }

            if row["subcategory_id"]:
                categories_dict[cat_id]["subcategories"].append({
                    "id": row["subcategory_id"],
                    "name": row["subcategory_name"],
                    "description": row["subcategory_description"],
                    "created_at": row["subcategory_created_at"]
                })

        return list(categories_dict.values())


class BotSubcategoryModel:
    @staticmethod
    def get_all(category_id: int = None):
        """Get all subcategories, optionally filtered by category"""
        conn = get_db()
        cursor = conn.cursor()

        if category_id:
            cursor.execute("""
                SELECT s.*, c.name as category_name
                FROM bot_subcategories s
                JOIN bot_categories c ON s.category_id = c.id
                WHERE s.category_id = ?
                ORDER BY s.name
            """, (category_id,))
        else:
            cursor.execute("""
                SELECT s.*, c.name as category_name
                FROM bot_subcategories s
                JOIN bot_categories c ON s.category_id = c.id
                ORDER BY c.name, s.name
            """)

        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(subcategory_id: int):
        """Get a subcategory by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, c.name as category_name
            FROM bot_subcategories s
            JOIN bot_categories c ON s.category_id = c.id
            WHERE s.id = ?
        """, (subcategory_id,))
        result = cursor.fetchone()
        return dict(result) if result else None

    @staticmethod
    def create(category_id: int, name: str, description: str = None):
        """Create a new subcategory"""
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO bot_subcategories (category_id, name, description) VALUES (?, ?, ?)",
                (category_id, name, description)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    @staticmethod
    def update(subcategory_id: int, name: str = None, description: str = None, category_id: int = None):
        """Update a subcategory"""
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if category_id is not None:
            updates.append("category_id = ?")
            params.append(category_id)

        if not updates:
            return False

        params.append(subcategory_id)

        try:
            cursor.execute(
                f"UPDATE bot_subcategories SET {', '.join(updates)} WHERE id = ?",
                params
            )
            conn.commit()
            return cursor.rowcount > 0
        except sqlite3.IntegrityError:
            return False

    @staticmethod
    def delete(subcategory_id: int):
        """Delete a subcategory"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bot_subcategories WHERE id = ?", (subcategory_id,))
        conn.commit()
        return cursor.rowcount > 0


class SupportChatModel:
    @staticmethod
    def get_or_create_conversation(user_id: int) -> Dict[str, Any]:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM support_conversations WHERE user_id = ?",
            (user_id,)
        )
        existing = cursor.fetchone()
        if existing:
            return dict(existing)

        cursor.execute(
            "INSERT INTO support_conversations (user_id, status) VALUES (?, 'open')",
            (user_id,)
        )
        conn.commit()

        cursor.execute("SELECT * FROM support_conversations WHERE id = ?", (cursor.lastrowid,))
        return dict(cursor.fetchone())

    @staticmethod
    def get_conversation_by_id(conversation_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT sc.*, u.email, u.full_name
               FROM support_conversations sc
               JOIN users u ON u.id = sc.user_id
               WHERE sc.id = ?""",
            (conversation_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_conversation_for_user(user_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT sc.*, u.email, u.full_name
               FROM support_conversations sc
               JOIN users u ON u.id = sc.user_id
               WHERE sc.user_id = ?""",
            (user_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def mark_conversation_as_read(conversation_id: int, reader_role: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()

        if reader_role == "user":
            cursor.execute(
                "UPDATE support_conversations SET last_read_by_user_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conversation_id,)
            )
        elif reader_role == "admin":
            cursor.execute(
                "UPDATE support_conversations SET last_read_by_admin_at = CURRENT_TIMESTAMP WHERE id = ?",
                (conversation_id,)
            )
        else:
            return False

        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def add_message(conversation_id: int, sender_id: int, sender_role: str, message: str) -> Optional[int]:
        conn = get_db()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """INSERT INTO support_messages (conversation_id, sender_id, sender_role, message)
                   VALUES (?, ?, ?, ?)""",
                (conversation_id, sender_id, sender_role, message)
            )

            preview = message.strip()[:120] if message else ""
            cursor.execute(
                """UPDATE support_conversations
                   SET updated_at = CURRENT_TIMESTAMP,
                       last_message_at = CURRENT_TIMESTAMP,
                       last_message_preview = ?,
                       last_sender_role = ?,
                       last_read_by_admin_at = CASE WHEN ? = 'admin' THEN CURRENT_TIMESTAMP ELSE last_read_by_admin_at END,
                       status = CASE WHEN ? = 'user' THEN 'open' ELSE status END
                   WHERE id = ?""",
                (preview, sender_role, sender_role, sender_role, conversation_id)
            )

            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error adding support message: {e}")
            return None

    @staticmethod
    def get_messages(conversation_id: int, limit: int = 200) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """SELECT sm.*, u.email, u.full_name
               FROM support_messages sm
               JOIN users u ON sm.sender_id = u.id
               WHERE sm.conversation_id = ?
               ORDER BY sm.created_at ASC
               LIMIT ?""",
            (conversation_id, limit)
        )
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_admin_conversations(
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        query = """
            SELECT
                u.id as user_id,
                u.email,
                u.full_name,
                sc.id,
                sc.status,
                COALESCE(
                    sc.last_sender_role,
                    (
                        SELECT sm2.sender_role
                        FROM support_messages sm2
                        WHERE sm2.conversation_id = sc.id
                        ORDER BY sm2.created_at DESC, sm2.id DESC
                        LIMIT 1
                    )
                ) as last_sender_role,
                sc.last_message_preview,
                sc.last_message_at,
                sc.created_at,
                sc.updated_at,
                COALESCE((SELECT COUNT(*) FROM support_messages sm WHERE sm.conversation_id = sc.id), 0) as message_count,
                COALESCE(
                    (
                        SELECT COUNT(*)
                        FROM support_messages smu
                        WHERE smu.conversation_id = sc.id
                          AND smu.sender_role = 'user'
                          AND smu.created_at > COALESCE(
                              sc.last_read_by_admin_at,
                              '1970-01-01 00:00:00'
                          )
                    ),
                    0
                ) as unread_count
            FROM users u
            LEFT JOIN support_conversations sc ON sc.user_id = u.id
            WHERE 1=1
        """
        params: List[Any] = []

        if search:
            query += " AND (u.email LIKE ? OR COALESCE(u.full_name, '') LIKE ?)"
            like_value = f"%{search.strip()}%"
            params.extend([like_value, like_value])

        if status:
            query += " AND sc.status = ?"
            params.append(status)

        query += " ORDER BY COALESCE(sc.last_message_at, u.created_at) DESC, u.id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def update_status(conversation_id: int, status: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE support_conversations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (status, conversation_id)
        )
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def archive_and_close_conversation(conversation_id: int, closed_by: Optional[int] = None) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM support_conversations WHERE id = ?", (conversation_id,))
        conversation = cursor.fetchone()
        if not conversation:
            return None

        conversation_dict = dict(conversation)
        history_status = "closed" if conversation_dict.get("status") == "closed" else "opened"
        continued_history_id = conversation_dict.get("continued_history_id")

        cursor.execute(
            """SELECT sm.*, u.email, u.full_name
               FROM support_messages sm
               LEFT JOIN users u ON sm.sender_id = u.id
               WHERE sm.conversation_id = ?
               ORDER BY sm.created_at ASC""",
            (conversation_id,)
        )
        messages = [dict(row) for row in cursor.fetchall()]

        history_id = None
        if continued_history_id:
            cursor.execute(
                "SELECT id FROM support_conversation_history WHERE id = ? AND user_id = ?",
                (continued_history_id, conversation_dict["user_id"])
            )
            existing_history = cursor.fetchone()
            if existing_history:
                history_id = continued_history_id
                cursor.execute(
                    """UPDATE support_conversation_history
                       SET status = ?,
                           closed_by = ?,
                           last_message_preview = ?,
                           last_message_at = ?,
                           updated_at = ?,
                           message_count = ?,
                           closed_at = CURRENT_TIMESTAMP
                       WHERE id = ?""",
                    (
                        history_status,
                        closed_by,
                        conversation_dict.get("last_message_preview"),
                        conversation_dict.get("last_message_at"),
                        conversation_dict.get("updated_at"),
                        len(messages),
                        history_id,
                    )
                )
                cursor.execute("DELETE FROM support_message_history WHERE history_id = ?", (history_id,))

        if not history_id:
            cursor.execute(
                """INSERT INTO support_conversation_history
                   (original_conversation_id, user_id, status, closed_by, last_message_preview, last_message_at, created_at, updated_at, message_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    conversation_id,
                    conversation_dict["user_id"],
                    history_status,
                    closed_by,
                    conversation_dict.get("last_message_preview"),
                    conversation_dict.get("last_message_at"),
                    conversation_dict.get("created_at"),
                    conversation_dict.get("updated_at"),
                    len(messages),
                )
            )
            history_id = cursor.lastrowid

        for message in messages:
            cursor.execute(
                """INSERT INTO support_message_history
                   (history_id, sender_id, sender_role, message, sender_email, sender_full_name, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    history_id,
                    message.get("sender_id"),
                    message.get("sender_role"),
                    message.get("message"),
                    message.get("email"),
                    message.get("full_name"),
                    message.get("created_at"),
                )
            )

        cursor.execute("DELETE FROM support_conversations WHERE id = ?", (conversation_id,))
        conn.commit()

        cursor.execute("SELECT * FROM support_conversation_history WHERE id = ?", (history_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_admin_history(
        user_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()

        query = """
            SELECT h.*, u.email, u.full_name
            FROM support_conversation_history h
            JOIN users u ON h.user_id = u.id
            WHERE 1=1
        """
        params: List[Any] = []

        if user_id:
            query += " AND h.user_id = ?"
            params.append(user_id)

        if search:
            like_value = f"%{search.strip()}%"
            query += " AND (u.email LIKE ? OR COALESCE(u.full_name, '') LIKE ?)"
            params.extend([like_value, like_value])

        query += " ORDER BY h.closed_at DESC, h.id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_history_messages(history_id: int, limit: int = 500) -> List[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT h.*, u.email, u.full_name
               FROM support_message_history h
               LEFT JOIN users u ON h.sender_id = u.id
               WHERE h.history_id = ?
               ORDER BY h.created_at ASC
               LIMIT ?""",
            (history_id, limit)
        )
        rows = [dict(row) for row in cursor.fetchall()]

        for row in rows:
            if not row.get("email") and row.get("sender_email"):
                row["email"] = row.get("sender_email")
            if not row.get("full_name") and row.get("sender_full_name"):
                row["full_name"] = row.get("sender_full_name")

        return rows

    @staticmethod
    def get_history_by_id(history_id: int) -> Optional[Dict[str, Any]]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT h.*, u.email, u.full_name
               FROM support_conversation_history h
               JOIN users u ON u.id = h.user_id
               WHERE h.id = ?""",
            (history_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

    @staticmethod
    def delete_conversation(conversation_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM support_conversations WHERE id = ?", (conversation_id,))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def delete_history(history_id: int) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM support_conversation_history WHERE id = ?", (history_id,))
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def update_history_status(history_id: int, status: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE support_conversation_history SET status = ? WHERE id = ?",
            (status, history_id)
        )
        conn.commit()
        return cursor.rowcount > 0

    @staticmethod
    def continue_from_history(history_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        history = SupportChatModel.get_history_by_id(history_id)
        if not history or history.get("user_id") != user_id:
            return None

        conn = get_db()
        cursor = conn.cursor()

        conversation = SupportChatModel.get_conversation_for_user(user_id)
        if conversation:
            if conversation.get("status") == "closed":
                SupportChatModel.update_status(conversation["id"], "open")
                conversation = SupportChatModel.get_conversation_by_id(conversation["id"])
        else:
            conversation = SupportChatModel.get_or_create_conversation(user_id)

        cursor.execute(
            """UPDATE support_conversations
               SET continued_history_id = ?,
                   status = 'open',
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?""",
            (history_id, conversation["id"])
        )
        conn.commit()
        conversation = SupportChatModel.get_conversation_by_id(conversation["id"])

        cursor.execute(
            "SELECT COUNT(*) as cnt FROM support_messages WHERE conversation_id = ?",
            (conversation["id"],)
        )
        message_count_row = cursor.fetchone()
        existing_messages_count = (message_count_row["cnt"] if message_count_row else 0)

        if existing_messages_count == 0:
            cursor.execute(
                """SELECT sender_id, sender_role, message, created_at
                   FROM support_message_history
                   WHERE history_id = ?
                   ORDER BY created_at ASC, id ASC""",
                (history_id,)
            )
            history_messages = [dict(row) for row in cursor.fetchall()]
            last_history_sender_role = history_messages[-1].get("sender_role") if history_messages else None

            for message in history_messages:
                sender_id = message.get("sender_id")
                if not sender_id:
                    continue

                cursor.execute(
                    """INSERT INTO support_messages (conversation_id, sender_id, sender_role, message, created_at)
                       VALUES (?, ?, ?, ?, ?)""",
                    (
                        conversation["id"],
                        sender_id,
                        message.get("sender_role"),
                        message.get("message"),
                        message.get("created_at"),
                    )
                )

            cursor.execute(
                """UPDATE support_conversations
                   SET status = 'open',
                       last_message_preview = ?,
                       last_message_at = ?,
                       last_sender_role = ?,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?""",
                (
                    history.get("last_message_preview"),
                    history.get("last_message_at"),
                    last_history_sender_role,
                    conversation["id"],
                )
            )
            conn.commit()
            conversation = SupportChatModel.get_conversation_by_id(conversation["id"])

        SupportChatModel.update_history_status(history_id, "opened")
        return conversation
