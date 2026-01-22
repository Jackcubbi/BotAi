import argparse
import importlib
import io
import json
import sqlite3
import threading
import time
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH
from models import UserModel


def _ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000.0, 2)


def _print_header(title: str) -> None:
    print(f"\n=== {title} ===")


def _http_json(method: str, url: str, payload: Optional[dict] = None, timeout: float = 8.0, headers: Optional[dict] = None):
    data = None
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = Request(url, method=method, data=data, headers=request_headers)
    start = time.perf_counter()

    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
            try:
                body = json.loads(raw)
            except Exception:
                body = {"raw": raw[:500]}
            return {
                "ok": True,
                "status": response.status,
                "elapsed_ms": _ms(start),
                "body": body,
            }
    except HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            body = json.loads(raw)
        except Exception:
            body = {"raw": raw[:500]}
        return {
            "ok": False,
            "status": error.code,
            "elapsed_ms": _ms(start),
            "body": body,
        }
    except URLError as error:
        return {
            "ok": False,
            "status": None,
            "elapsed_ms": _ms(start),
            "body": {"error": str(error)},
        }
    except Exception as error:
        return {
            "ok": False,
            "status": None,
            "elapsed_ms": _ms(start),
            "body": {"error": str(error)},
        }


def check_runtime_chain() -> None:
    _print_header("Runtime Chain")
    try:
        passenger = importlib.import_module("passenger_wsgi")
        asgi_app = getattr(passenger, "_asgi_application", None)
        asgi_error = getattr(passenger, "_asgi_import_error", None)

        print(f"passenger_wsgi import: ok")
        print(f"asgi_application loaded: {'yes' if asgi_app is not None else 'no'}")
        if asgi_error:
            print(f"asgi_import_error: {asgi_error}")
    except Exception as error:
        print(f"passenger_wsgi import: failed | error={error}")


def _run_wsgi_request(application, method: str, path: str, timeout: float, payload: Optional[dict] = None, token: Optional[str] = None):
    result = {
        "status": "failed",
        "elapsed_ms": 0.0,
        "body": {},
        "error": "",
    }

    def _worker():
        start = time.perf_counter()
        state = {"status": "", "headers": []}

        raw = b""
        if payload is not None:
            raw = json.dumps(payload).encode("utf-8")

        path_info = path
        query_string = ""
        if "?" in path:
            path_info, query_string = path.split("?", 1)

        environ = {
            "REQUEST_METHOD": method,
            "SCRIPT_NAME": "",
            "PATH_INFO": path_info,
            "QUERY_STRING": query_string,
            "SERVER_NAME": "localhost",
            "SERVER_PORT": "80",
            "SERVER_PROTOCOL": "HTTP/1.1",
            "CONTENT_TYPE": "application/json",
            "CONTENT_LENGTH": str(len(raw)),
            "wsgi.version": (1, 0),
            "wsgi.url_scheme": "http",
            "wsgi.input": io.BytesIO(raw),
            "wsgi.errors": None,
            "wsgi.multithread": True,
            "wsgi.multiprocess": False,
            "wsgi.run_once": False,
        }

        if token:
            environ["HTTP_AUTHORIZATION"] = f"Bearer {token}"

        def start_response(status, headers, exc_info=None):
            state["status"] = status
            state["headers"] = headers
            return None

        try:
            iterable = application(environ, start_response)
            chunks = []
            try:
                for chunk in iterable:
                    chunks.append(chunk)
            finally:
                if hasattr(iterable, "close"):
                    iterable.close()

            text = b"".join(chunks).decode("utf-8", errors="replace")
            try:
                body = json.loads(text) if text else {}
            except Exception:
                body = {"raw": text[:300]}

            result["status"] = state["status"] or "no-status"
            result["elapsed_ms"] = _ms(start)
            result["body"] = body
        except Exception as error:
            result["status"] = "failed"
            result["elapsed_ms"] = _ms(start)
            result["error"] = str(error)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        return {
            "status": "timed-out",
            "elapsed_ms": round(timeout * 1000.0, 2),
            "body": {},
            "error": "WSGI callable did not return in time",
        }

    return result


def check_inprocess_auth(email: Optional[str], password: Optional[str], timeout: float) -> None:
    _print_header("In-Process WSGI Auth Flow")
    try:
        passenger = importlib.import_module("passenger_wsgi")
        application = getattr(passenger, "application", None)
        if application is None:
            print("passenger_wsgi.application missing")
            return
    except Exception as error:
        print(f"passenger_wsgi import failed: {error}")
        return

    health = _run_wsgi_request(application, "GET", "/api/health", timeout)
    print(f"GET /api/health [in-process] | status={health['status']} | {health['elapsed_ms']} ms | body={str(health['body'])[:220]}")

    email_for_check = email or "placeholder@example.com"
    check_email = _run_wsgi_request(application, "GET", f"/api/auth/check-email?email={email_for_check}", timeout)
    print(f"GET /api/auth/check-email [in-process] | status={check_email['status']} | {check_email['elapsed_ms']} ms | body={str(check_email['body'])[:220]}")

    if not email or not password:
        print("login_test [in-process]: skipped (provide --email and --password)")
        return

    login = _run_wsgi_request(
        application,
        "POST",
        "/api/auth/login",
        timeout,
        payload={"email": email, "password": password},
    )
    print(f"POST /api/auth/login [in-process] | status={login['status']} | {login['elapsed_ms']} ms | body={str(login['body'])[:220]}")

    token = (login.get("body") or {}).get("access_token")
    user_id = ((login.get("body") or {}).get("user") or {}).get("id")
    if not token or not user_id:
        print("profile_test [in-process]: skipped (login response missing token or user id)")
        return

    profile = _run_wsgi_request(
        application,
        "GET",
        f"/api/auth/profile/{user_id}",
        timeout,
        token=token,
    )
    print(f"GET /api/auth/profile/{{id}} [in-process] | status={profile['status']} | {profile['elapsed_ms']} ms | body={str(profile['body'])[:220]}")


def check_database_auth(email: Optional[str], password: Optional[str]) -> None:
    _print_header("Database Auth State")
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM users")
    total_users = int(cursor.fetchone()["count"] or 0)
    print(f"users_total: {total_users}")

    cursor.execute("SELECT COUNT(*) as count FROM users WHERE password_hash IS NULL OR password_hash = ''")
    missing_hash = int(cursor.fetchone()["count"] or 0)
    print(f"users_missing_password_hash: {missing_hash}")

    if email:
        user = UserModel.get_by_email(email)
        if not user:
            print(f"lookup_user: not found ({email})")
        else:
            hash_preview = (user.get("password_hash") or "")[:10]
            print(f"lookup_user: found id={user['id']} email={user['email']} hash_prefix={hash_preview}")
            if password:
                valid = UserModel.verify_password(password, user.get("password_hash") or "")
                print(f"password_verify_local: {'ok' if valid else 'failed'}")

    conn.close()


def check_http_auth(base_url: str, email: Optional[str], password: Optional[str], timeout: float) -> None:
    _print_header("HTTP Auth Flow")

    health_url = f"{base_url.rstrip('/')}/api/health"
    health = _http_json("GET", health_url, timeout=timeout)
    print(f"GET /api/health | status={health['status']} | {health['elapsed_ms']} ms | body={str(health['body'])[:220]}")

    check_email_url = f"{base_url.rstrip('/')}/api/auth/check-email?email={email or 'placeholder@example.com'}"
    check_email = _http_json("GET", check_email_url, timeout=timeout)
    print(f"GET /api/auth/check-email | status={check_email['status']} | {check_email['elapsed_ms']} ms | body={str(check_email['body'])[:220]}")

    if not email or not password:
        print("login_test: skipped (provide --email and --password)")
        return

    login_url = f"{base_url.rstrip('/')}/api/auth/login"
    login = _http_json(
        "POST",
        login_url,
        payload={"email": email, "password": password},
        timeout=timeout,
    )
    print(f"POST /api/auth/login | status={login['status']} | {login['elapsed_ms']} ms | body={str(login['body'])[:220]}")

    if not login["ok"]:
        return

    token = login["body"].get("access_token")
    user = login["body"].get("user") or {}
    user_id = user.get("id")

    if not token or not user_id:
        print("profile_test: skipped (login response missing token or user id)")
        return

    profile_url = f"{base_url.rstrip('/')}/api/auth/profile/{user_id}"
    profile = _http_json(
        "GET",
        profile_url,
        timeout=timeout,
        headers={"Authorization": f"Bearer {token}"},
    )
    print(f"GET /api/auth/profile/{{id}} | status={profile['status']} | {profile['elapsed_ms']} ms | body={str(profile['body'])[:220]}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check login/auth flow from DB to API endpoints")
    parser.add_argument("--base-url", default="", help="Example: https://botai.rostsin.com")
    parser.add_argument("--email", default=None, help="User email to test login")
    parser.add_argument("--password", default=None, help="User password to test login")
    parser.add_argument("--timeout", type=float, default=8.0, help="HTTP timeout seconds")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    _print_header("Context")
    print(f"DATABASE_PATH: {DATABASE_PATH}")
    print(f"base_url: {args.base_url or 'not provided'}")

    check_runtime_chain()
    check_inprocess_auth(email=args.email, password=args.password, timeout=args.timeout)
    check_database_auth(email=args.email, password=args.password)

    if args.base_url:
        check_http_auth(base_url=args.base_url, email=args.email, password=args.password, timeout=args.timeout)
    else:
        print("\nHTTP Auth Flow skipped (provide --base-url)")

    _print_header("Interpretation")
    print("- If local password_verify is ok but /api/auth/login fails, issue is API/runtime layer.")
    print("- If /api/health works but /api/auth/* times out/fails, ASGI route forwarding is unhealthy.")
    print("- If in-process checks pass but HTTP checks timeout, issue is cPanel/LiteSpeed routing to app, not DB/auth code.")
    print("- If user lookup fails or password_verify fails, credentials/data issue in DB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
