import os
import sys
import json
import sqlite3
import threading
from urllib.parse import parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

_lock = threading.Lock()
_init_done = False
_init_errors = {}
_DATABASE_PATH = None
_UserModel = None
_RoleModel = None
_create_access_token = None
_verify_token = None


def _init_components():
    global _DATABASE_PATH, _UserModel, _RoleModel
    global _create_access_token, _verify_token, _init_done
    with _lock:
        if _init_done:
            return
        _init_done = True
        try:
            from config import DATABASE_PATH as _dp
            _DATABASE_PATH = _dp
        except Exception as e:
            _init_errors["config"] = str(e)
            _DATABASE_PATH = os.path.join(BASE_DIR, "data", "ecommerce.db")
        try:
            from models import UserModel, RoleModel
            _UserModel = UserModel
            _RoleModel = RoleModel
        except Exception as e:
            _init_errors["models"] = str(e)
        try:
            from middleware.auth import create_access_token, verify_token
            _create_access_token = create_access_token
            _verify_token = verify_token
        except Exception as e:
            _init_errors["auth"] = str(e)


def _json_response(start_response, payload, status="200 OK"):
    body = json.dumps(payload).encode("utf-8")
    start_response(status, [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(body))),
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Headers", "Authorization, Content-Type"),
        ("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"),
    ])
    return [body]


def _read_body(environ):
    try:
        n = int(environ.get("CONTENT_LENGTH") or 0)
    except Exception:
        n = 0
    if n <= 0:
        return {}
    try:
        return json.loads(environ["wsgi.input"].read(n).decode("utf-8"))
    except Exception:
        return {}


def _bearer(environ):
    h = environ.get("HTTP_AUTHORIZATION") or ""
    return h[7:].strip() if h.lower().startswith("bearer ") else ""


def _db():
    conn = sqlite3.connect(_DATABASE_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def _require_admin(environ):
    if _verify_token is None or _UserModel is None:
        return None, "Auth unavailable", 503
    token = _bearer(environ)
    if not token:
        return None, "Missing authorization token", 401
    try:
        uid = _verify_token(token)
    except Exception:
        return None, "Invalid token", 401
    user = _UserModel.get_by_id(uid)
    if not user:
        return None, "User not found", 404
    if uid == 1 or "admin" in (user.get("email") or "").lower():
        return uid, None, 200
    roles = (_RoleModel.get_user_roles(uid) if _RoleModel else []) or []
    if any(r.get("name") in ("admin", "super_admin") for r in roles):
        return uid, None, 200
    return None, "Forbidden: admin access required", 403


def _st(code):
    return {
        200: "200 OK", 201: "201 Created",
        400: "400 Bad Request", 401: "401 Unauthorized",
        403: "403 Forbidden", 404: "404 Not Found",
        409: "409 Conflict", 500: "500 Internal Server Error",
        503: "503 Service Unavailable",
    }.get(code, "500 Internal Server Error")


def _handle_check_email(full):
    q = full.split("?", 1)[1] if "?" in full else ""
    email = (parse_qs(q).get("email") or [""])[0].strip()
    return {"exists": bool(_UserModel and _UserModel.get_by_email(email))}


def _handle_login(environ):
    if not _UserModel or not _create_access_token:
        return None, "Auth unavailable", 503
    body = _read_body(environ)
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return None, "Email and password required", 400
    user = _UserModel.get_by_email(email)
    if not user or not _UserModel.verify_password(password, user.get("password_hash") or ""):
        return None, "Incorrect email or password", 401
    u = _UserModel.get_by_id(user["id"])
    if not u:
        return None, "User not found", 404
    u["roles"] = (_RoleModel.get_user_roles(user["id"]) if _RoleModel else []) or []
    return {"access_token": _create_access_token(user["id"]), "token_type": "bearer", "user": u}, None, 200


def _handle_register(environ):
    if not _UserModel or not _create_access_token:
        return None, "Auth unavailable", 503
    body = _read_body(environ)
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    full_name = (body.get("full_name") or "").strip()
    if not email or not password:
        return None, "Email and password required", 400
    if len(password) < 6:
        return None, "Password must be at least 6 characters", 400
    if _UserModel.get_by_email(email):
        return None, "Email already registered", 409
    try:
        uid = _UserModel.create(email=email, password=password, full_name=full_name)
    except Exception as e:
        return None, "Registration failed: " + str(e), 500
    u = _UserModel.get_by_id(uid)
    if not u:
        return None, "Created but not found", 500
    u["roles"] = (_RoleModel.get_user_roles(uid) if _RoleModel else []) or []
    return {"access_token": _create_access_token(uid), "token_type": "bearer", "user": u}, None, 201


def _handle_profile(path, environ):
    if not _UserModel or not _verify_token:
        return None, "Auth unavailable", 503
    try:
        rid = int(path.rstrip("/").rsplit("/", 1)[-1])
    except Exception:
        return None, "Invalid user id", 400
    token = _bearer(environ)
    if not token:
        return None, "Missing authorization token", 401
    try:
        uid = _verify_token(token)
    except Exception:
        return None, "Invalid token", 401
    if uid != rid:
        return None, "Forbidden", 403
    u = _UserModel.get_by_id(rid)
    if not u:
        return None, "User not found", 404
    u["roles"] = (_RoleModel.get_user_roles(rid) if _RoleModel else []) or []
    return u, None, 200


def _handle_marketplace(full):
    q = full.split("?", 1)[1] if "?" in full else ""
    qs = parse_qs(q)
    try:
        page = max(1, int((qs.get("page") or ["1"])[0]))
    except Exception:
        page = 1
    try:
        limit = min(100, max(1, int((qs.get("limit") or ["20"])[0])))
    except Exception:
        limit = 20
    category = (qs.get("category") or [None])[0]
    search = (qs.get("search") or [None])[0]
    conn = _db()
    cur = conn.cursor()
    try:
        params = []
        where = "WHERE is_public = 1"
        if category:
            where += " AND category = ?"
            params.append(category)
        if search:
            where += " AND (name LIKE ? OR description LIKE ?)"
            params += ["%" + search + "%", "%" + search + "%"]
        cur.execute("SELECT COUNT(*) as c FROM bots " + where, params)
        total = int(cur.fetchone()["c"] or 0)
        offset = (page - 1) * limit
        cur.execute("SELECT * FROM bots " + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?", params + [limit, offset])
        bots = [dict(r) for r in cur.fetchall()]
        for b in bots:
            b.setdefault("average_rating", 0.0)
            b.setdefault("total_reviews", 0)
            if not b.get("configuration"):
                b["configuration"] = "{}"
            b.pop("api_key", None)
        return {"bots": bots, "total": total, "page": page, "limit": limit}
    finally:
        conn.close()


def _handle_public_stats():
    conn = _db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) as c FROM bots WHERE is_public = 1")
        ab = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT COUNT(DISTINCT creator_id) as c FROM bots WHERE is_public = 1")
        tc = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT COUNT(*) as c FROM bot_conversations")
        cv = int(cur.fetchone()["c"] or 0)
        return {"active_bots": ab, "total_conversations": cv, "total_creators": tc}
    finally:
        conn.close()


def _handle_admin_stats(environ):
    uid, err, code = _require_admin(environ)
    if err:
        return None, err, code
    conn = _db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) as c FROM users")
        tu = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT COUNT(*) as c FROM bots")
        tb = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT COUNT(*) as c FROM bots WHERE is_public = 1")
        pb = int(cur.fetchone()["c"] or 0)
        return {"total_users": tu, "total_bots": tb, "public_bots": pb, "total_orders": 0}, None, 200
    finally:
        conn.close()


def _handle_admin_users(full, environ):
    uid, err, code = _require_admin(environ)
    if err:
        return None, err, code
    q = full.split("?", 1)[1] if "?" in full else ""
    qs = parse_qs(q)
    try:
        page = max(1, int((qs.get("page") or ["1"])[0]))
    except Exception:
        page = 1
    try:
        limit = min(200, max(1, int((qs.get("limit") or ["50"])[0])))
    except Exception:
        limit = 50
    search = (qs.get("search") or [None])[0]
    offset = (page - 1) * limit
    conn = _db()
    cur = conn.cursor()
    try:
        params = []
        where = ""
        if search:
            where = "WHERE email LIKE ? OR full_name LIKE ?"
            params = ["%" + search + "%", "%" + search + "%"]
        cur.execute("SELECT COUNT(*) as c FROM users " + where, params)
        total = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT id, email, full_name, created_at FROM users " + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?", params + [limit, offset])
        users = [dict(r) for r in cur.fetchall()]
        for u in users:
            u["roles"] = (_RoleModel.get_user_roles(u["id"]) if _RoleModel else []) or []
        return {"users": users, "total": total, "page": page, "limit": limit}, None, 200
    finally:
        conn.close()


def _handle_admin_bots(full, environ):
    uid, err, code = _require_admin(environ)
    if err:
        return None, err, code
    q = full.split("?", 1)[1] if "?" in full else ""
    qs = parse_qs(q)
    try:
        page = max(1, int((qs.get("page") or ["1"])[0]))
    except Exception:
        page = 1
    try:
        limit = min(200, max(1, int((qs.get("limit") or ["50"])[0])))
    except Exception:
        limit = 50
    offset = (page - 1) * limit
    conn = _db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) as c FROM bots")
        total = int(cur.fetchone()["c"] or 0)
        cur.execute("SELECT id, name, description, category, creator_id, is_public, price, created_at, updated_at FROM bots ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset])
        bots = [dict(r) for r in cur.fetchall()]
        return {"bots": bots, "total": total, "page": page, "limit": limit}, None, 200
    finally:
        conn.close()


def application(environ, start_response):
    method = (environ.get("REQUEST_METHOD") or "GET").upper()
    path = (environ.get("PATH_INFO") or "/").rstrip("/") or "/"
    query = environ.get("QUERY_STRING") or ""
    full = (path + "?" + query) if query else path

    if method == "OPTIONS":
        return _json_response(start_response, {})

    _init_components()

    if method == "GET" and path in {"/api/health", "/health"}:
        return _json_response(start_response, {
            "status": "ok",
            "db_exists": os.path.isfile(_DATABASE_PATH or ""),
            "db_path": _DATABASE_PATH,
            "models_ok": _UserModel is not None,
            "auth_ok": _verify_token is not None,
            "errors": _init_errors,
        })

    if method == "GET" and path in {"/api/debug", "/debug"}:
        return _json_response(start_response, {
            "db_path": _DATABASE_PATH,
            "db_exists": os.path.isfile(_DATABASE_PATH or ""),
            "errors": _init_errors,
            "python": sys.version,
            "base_dir": BASE_DIR,
            "sys_path": sys.path[:6],
        })

    if method == "GET" and path in {"/api/auth/check-email", "/auth/check-email"}:
        try:
            return _json_response(start_response, _handle_check_email(full))
        except Exception as e:
            return _json_response(start_response, {"detail": str(e)}, "500 Internal Server Error")

    if method == "POST" and path in {"/api/auth/login", "/auth/login"}:
        payload, err, code = _handle_login(environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload)

    if method == "POST" and path in {"/api/auth/register", "/auth/register"}:
        payload, err, code = _handle_register(environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload, _st(code))

    if method == "GET" and (path.startswith("/api/auth/profile/") or path.startswith("/auth/profile/")):
        payload, err, code = _handle_profile(path, environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload)

    if method == "GET" and path in {"/api/bots/public-stats", "/bots/public-stats"}:
        try:
            return _json_response(start_response, _handle_public_stats())
        except Exception as e:
            return _json_response(start_response, {"error": str(e)}, "500 Internal Server Error")

    if method == "GET" and path in {"/api/bots/marketplace", "/bots/marketplace"}:
        try:
            return _json_response(start_response, _handle_marketplace(full))
        except Exception as e:
            return _json_response(start_response, {"error": str(e)}, "500 Internal Server Error")

    if method == "GET" and path in {"/api/admin/stats", "/admin/stats"}:
        payload, err, code = _handle_admin_stats(environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload)

    if method == "GET" and path in {"/api/admin/users", "/admin/users"}:
        payload, err, code = _handle_admin_users(full, environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload)

    if method == "GET" and path in {"/api/admin/bots", "/admin/bots"}:
        payload, err, code = _handle_admin_bots(full, environ)
        if err:
            return _json_response(start_response, {"detail": err}, _st(code))
        return _json_response(start_response, payload)

    return _json_response(start_response, {
        "error": "route not available",
        "path": path,
        "method": method,
    }, "404 Not Found")
