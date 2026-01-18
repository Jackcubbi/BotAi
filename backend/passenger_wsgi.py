import os
import sys
import json
import sqlite3
from urllib.parse import parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import DATABASE_PATH
from models import UserModel, RoleModel
from middleware.auth import create_access_token, verify_token

_asgi_application = None
_asgi_import_error = None
try:
    from app_entry import application as _asgi_application
except Exception as error:
    _asgi_import_error = str(error)


def _json_response(start_response, payload: dict, status: str = "200 OK"):
    body = json.dumps(payload).encode("utf-8")
    headers = [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(body))),
    ]
    start_response(status, headers)
    return [body]


def _read_json_body(environ):
    try:
        content_length = int(environ.get("CONTENT_LENGTH", "0") or "0")
    except Exception:
        content_length = 0

    if content_length <= 0:
        return {}

    raw_body = environ["wsgi.input"].read(content_length)
    if not raw_body:
        return {}

    try:
        return json.loads(raw_body.decode("utf-8"))
    except Exception:
        return {}


def _extract_bearer_token(environ):
    auth_header = environ.get("HTTP_AUTHORIZATION") or ""
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return None


def _auth_check_email_payload(path: str):
    query = ""
    if "?" in path:
        _, query = path.split("?", 1)
    qs = parse_qs(query)
    email = (qs.get("email") or [""])[0].strip()
    user = UserModel.get_by_email(email) if email else None
    return {"exists": user is not None}


def _auth_login_payload(environ):
    body = _read_json_body(environ)
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not email or not password:
        return None, "Invalid login payload", 400

    user = UserModel.get_by_email(email)
    if not user or not UserModel.verify_password(password, user.get("password_hash") or ""):
        return None, "Incorrect email or password", 401

    user_response = UserModel.get_by_id(user["id"])
    if not user_response:
        return None, "User not found", 404

    roles = RoleModel.get_user_roles(user["id"])
    user_response["roles"] = roles

    access_token = create_access_token(user["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response,
    }, None, 200


def _auth_profile_payload(path: str, environ):
    parts = path.strip("/").split("/")
    user_id_str = parts[-1] if parts else ""

    try:
        requested_user_id = int(user_id_str)
    except Exception:
        return None, "Invalid user id", 400

    token = _extract_bearer_token(environ)
    if not token:
        return None, "Missing authorization token", 401

    try:
        current_user_id = verify_token(token)
    except Exception:
        return None, "Invalid authentication credentials", 401

    if current_user_id != requested_user_id:
        return None, "Not authorized to view this profile", 403

    user = UserModel.get_by_id(requested_user_id)
    if not user:
        return None, "User not found", 404

    roles = RoleModel.get_user_roles(requested_user_id)
    user["roles"] = roles
    return user, None, 200


def _marketplace_payload(path: str):
    query = ""
    if "?" in path:
        _, query = path.split("?", 1)
    qs = parse_qs(query)
    try:
        page = max(1, int((qs.get("page") or ["1"])[0]))
    except Exception:
        page = 1
    try:
        limit = min(100, max(1, int((qs.get("limit") or ["20"])[0])))
    except Exception:
        limit = 20
    category = (qs.get("category") or [None])[0]

    conn = sqlite3.connect(DATABASE_PATH, timeout=3)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        params = []
        where = "WHERE is_public = 1"
        if category:
            where += " AND category = ?"
            params.append(category)

        cursor.execute(f"SELECT COUNT(*) as count FROM bots {where}", params)
        total = int(cursor.fetchone()["count"] or 0)

        offset = (page - 1) * limit
        cursor.execute(
            f"""
            SELECT * FROM bots
            {where}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        )
        bots = [dict(row) for row in cursor.fetchall()]
        for bot in bots:
            bot["average_rating"] = 0.0
            bot["total_reviews"] = 0
            if "configuration" not in bot or bot["configuration"] is None:
                bot["configuration"] = "{}"

        return {
            "bots": bots,
            "total": total,
            "page": page,
            "limit": limit,
        }
    finally:
        conn.close()


def _public_stats_payload():
    conn = sqlite3.connect(DATABASE_PATH, timeout=3)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) as count FROM bots WHERE is_public = 1")
        active_bots = int(cursor.fetchone()["count"] or 0)

        cursor.execute("SELECT COUNT(DISTINCT creator_id) as count FROM bots WHERE is_public = 1")
        total_creators = int(cursor.fetchone()["count"] or 0)

        cursor.execute("SELECT COUNT(*) as count FROM bot_conversations")
        total_conversations = int(cursor.fetchone()["count"] or 0)

        return {
            "active_bots": active_bots,
            "total_conversations": total_conversations,
            "total_creators": total_creators,
        }
    finally:
        conn.close()


def application(environ, start_response):
    method = (environ.get("REQUEST_METHOD") or "GET").upper()
    path = (environ.get("PATH_INFO") or "").rstrip("/")
    query = environ.get("QUERY_STRING") or ""
    full_path = f"{path}?{query}" if query else path

    if method == "GET" and path in {"/api/health", "/health"}:
        return _json_response(start_response, {"status": "healthy", "mode": "wsgi-fallback"})

    if method == "GET" and path in {"/api/auth/check-email", "/auth/check-email"}:
        try:
            return _json_response(start_response, _auth_check_email_payload(full_path))
        except Exception as error:
            return _json_response(start_response, {"detail": str(error)}, status="500 Internal Server Error")

    if method == "POST" and path in {"/api/auth/login", "/auth/login"}:
        payload, error, status_code = _auth_login_payload(environ)
        if error:
            status_text = {
                400: "400 Bad Request",
                401: "401 Unauthorized",
                404: "404 Not Found",
            }.get(status_code, "500 Internal Server Error")
            return _json_response(start_response, {"detail": error}, status=status_text)
        return _json_response(start_response, payload)

    if method == "GET" and (path.startswith("/api/auth/profile/") or path.startswith("/auth/profile/")):
        payload, error, status_code = _auth_profile_payload(path, environ)
        if error:
            status_text = {
                400: "400 Bad Request",
                401: "401 Unauthorized",
                403: "403 Forbidden",
                404: "404 Not Found",
            }.get(status_code, "500 Internal Server Error")
            return _json_response(start_response, {"detail": error}, status=status_text)
        return _json_response(start_response, payload)

    if method == "GET" and path in {"/api/bots/public-stats", "/bots/public-stats"}:
        try:
            return _json_response(start_response, _public_stats_payload())
        except Exception as error:
            return _json_response(start_response, {"error": str(error)}, status="500 Internal Server Error")

    if method == "GET" and path in {"/api/bots/marketplace", "/bots/marketplace"}:
        try:
            return _json_response(start_response, _marketplace_payload(full_path))
        except Exception as error:
            return _json_response(start_response, {"error": str(error)}, status="500 Internal Server Error")

    if _asgi_application is None:
        return _json_response(
            start_response,
            {
                "error": "ASGI application unavailable",
                "details": _asgi_import_error,
            },
            status="503 Service Unavailable",
        )

    return _asgi_application(environ, start_response)
