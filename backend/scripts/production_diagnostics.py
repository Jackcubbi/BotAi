import argparse
import importlib
import io
import os
import platform
import sqlite3
import sys
import threading
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from _bootstrap import add_backend_to_path

add_backend_to_path()

from config import DATABASE_PATH


def _ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000.0, 2)


def _print_header(title: str) -> None:
    print(f"\n=== {title} ===")


def _run_query(cursor: sqlite3.Cursor, sql: str, params=()):
    start = time.perf_counter()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    elapsed = _ms(start)
    return rows, elapsed


def check_environment() -> None:
    _print_header("Environment")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Platform: {platform.platform()}")
    print(f"CWD: {os.getcwd()}")
    print(f"DATABASE_PATH: {DATABASE_PATH}")
    print(f"DB exists: {os.path.exists(DATABASE_PATH)}")
    if os.path.exists(DATABASE_PATH):
        print(f"DB size bytes: {os.path.getsize(DATABASE_PATH)}")


def check_runtime_import_chain() -> None:
    _print_header("Runtime Import Chain")

    modules = [
        "a2wsgi",
        "main",
        "app_entry",
        "passenger_wsgi",
    ]

    for module_name in modules:
        start = time.perf_counter()
        try:
            importlib.import_module(module_name)
            print(f"{module_name}: ok | {_ms(start)} ms")
        except Exception as error:
            print(f"{module_name}: failed | {_ms(start)} ms | error: {error}")


def _run_wsgi_request(application, path: str, timeout_seconds: float):
    result = {
        "status": "failed",
        "elapsed_ms": 0.0,
        "body": "",
        "error": "",
    }

    def _worker():
        start = time.perf_counter()
        state = {"status": "", "headers": []}

        def start_response(status, headers, exc_info=None):
            state["status"] = status
            state["headers"] = headers
            return None

        try:
            path_info = path
            query_string = ""
            if "?" in path:
                path_info, query_string = path.split("?", 1)

            environ = {
                "REQUEST_METHOD": "GET",
                "SCRIPT_NAME": "",
                "PATH_INFO": path_info,
                "QUERY_STRING": query_string,
                "SERVER_NAME": "localhost",
                "SERVER_PORT": "80",
                "SERVER_PROTOCOL": "HTTP/1.1",
                "wsgi.version": (1, 0),
                "wsgi.url_scheme": "http",
                "wsgi.input": io.BytesIO(b""),
                "wsgi.errors": sys.stderr,
                "wsgi.multithread": True,
                "wsgi.multiprocess": False,
                "wsgi.run_once": False,
            }

            iterable = application(environ, start_response)
            chunks = []
            try:
                for chunk in iterable:
                    chunks.append(chunk)
            finally:
                if hasattr(iterable, "close"):
                    iterable.close()

            body = b"".join(chunks)[:300].decode("utf-8", errors="replace")
            result["status"] = state["status"] or "no-status"
            result["elapsed_ms"] = _ms(start)
            result["body"] = body
        except Exception as error:
            result["status"] = "failed"
            result["elapsed_ms"] = _ms(start)
            result["error"] = str(error)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    thread.join(timeout=timeout_seconds)

    if thread.is_alive():
        return {
            "status": "timed-out",
            "elapsed_ms": round(timeout_seconds * 1000.0, 2),
            "body": "",
            "error": "WSGI callable did not return in time",
        }

    return result


def check_inprocess_wsgi(timeout_seconds: float) -> None:
    _print_header("In-Process WSGI Checks")

    try:
        passenger_module = importlib.import_module("passenger_wsgi")
        application = getattr(passenger_module, "application", None)
        if application is None:
            print("passenger_wsgi.application missing")
            return
    except Exception as error:
        print(f"Failed to import passenger_wsgi: {error}")
        return

    paths = [
        "/api/bots/public-stats",
        "/api/bots/marketplace?page=1&limit=20",
        "/bots/public-stats",
        "/bots/marketplace?page=1&limit=20",
        "/api/health",
        "/health",
    ]

    for path in paths:
        result = _run_wsgi_request(application, path, timeout_seconds=timeout_seconds)
        if result["status"] == "failed":
            print(f"{path} | status: failed | {result['elapsed_ms']} ms | error: {result['error']}")
        elif result["status"] == "timed-out":
            print(f"{path} | status: timed-out | {result['elapsed_ms']} ms | error: {result['error']}")
        else:
            print(f"{path} | status: {result['status']} | {result['elapsed_ms']} ms | body: {result['body']}")


def check_database_queries(timeout_seconds: float) -> None:
    _print_header("Database Connectivity & Query Timings")

    connect_start = time.perf_counter()
    conn = sqlite3.connect(DATABASE_PATH, timeout=timeout_seconds)
    conn.row_factory = sqlite3.Row
    print(f"Connect ms: {_ms(connect_start)}")

    try:
        cursor = conn.cursor()

        rows, elapsed = _run_query(cursor, "PRAGMA journal_mode")
        print(f"PRAGMA journal_mode ms: {elapsed} | value: {rows[0][0] if rows else 'unknown'}")

        rows, elapsed = _run_query(cursor, "PRAGMA busy_timeout")
        print(f"PRAGMA busy_timeout ms: {elapsed} | value: {rows[0][0] if rows else 'unknown'}")

        rows, elapsed = _run_query(
            cursor,
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        table_names = [r[0] for r in rows]
        print(f"List tables ms: {elapsed} | count: {len(table_names)}")

        for table_name in ["users", "bots", "bot_conversations", "bot_reviews", "bot_purchases"]:
            if table_name not in table_names:
                print(f"{table_name}: missing")
                continue
            rows, elapsed = _run_query(cursor, f"SELECT COUNT(*) as count FROM {table_name}")
            count = int(rows[0]["count"]) if rows else 0
            print(f"{table_name}: {count} rows | {elapsed} ms")

        rows, elapsed = _run_query(
            cursor,
            "SELECT COUNT(*) as count FROM bots WHERE is_public = 1"
        )
        print(f"public_stats.active_bots ms: {elapsed} | value: {int(rows[0]['count']) if rows else 0}")

        rows, elapsed = _run_query(
            cursor,
            "SELECT COUNT(DISTINCT creator_id) as count FROM bots WHERE is_public = 1"
        )
        print(f"public_stats.total_creators ms: {elapsed} | value: {int(rows[0]['count']) if rows else 0}")

        rows, elapsed = _run_query(
            cursor,
            "SELECT COUNT(*) as count FROM bot_conversations"
        )
        print(f"public_stats.total_conversations ms: {elapsed} | value: {int(rows[0]['count']) if rows else 0}")

        rows, elapsed = _run_query(
            cursor,
            "SELECT id, name, category FROM bots WHERE is_public = 1 ORDER BY created_at DESC LIMIT 20 OFFSET 0"
        )
        marketplace_ids = [int(r["id"]) for r in rows]
        print(f"marketplace.list ms: {elapsed} | rows: {len(rows)}")

        rows, elapsed = _run_query(
            cursor,
            "SELECT COUNT(*) as count FROM bots WHERE is_public = 1"
        )
        print(f"marketplace.count ms: {elapsed} | value: {int(rows[0]['count']) if rows else 0}")

        if marketplace_ids:
            placeholders = ",".join(["?"] * len(marketplace_ids))
            rows, elapsed = _run_query(
                cursor,
                f"""
                SELECT bot_id, COUNT(*) as total_reviews, AVG(rating) as avg_rating
                FROM bot_reviews
                WHERE bot_id IN ({placeholders})
                GROUP BY bot_id
                """,
                tuple(marketplace_ids),
            )
            print(f"marketplace.rating_stats ms: {elapsed} | grouped rows: {len(rows)}")
        else:
            print("marketplace.rating_stats skipped: no public bots")

        lock_start = time.perf_counter()
        try:
            cursor.execute("BEGIN IMMEDIATE")
            cursor.execute("ROLLBACK")
            print(f"write-lock test ms: {_ms(lock_start)} | status: ok")
        except Exception as lock_error:
            print(f"write-lock test ms: {_ms(lock_start)} | status: failed | error: {lock_error}")

    finally:
        conn.close()


def check_http_endpoints(base_url: str, timeout_seconds: float) -> None:
    _print_header("HTTP Endpoint Checks")

    endpoints = [
        "/health",
        "/api/health",
        "/api/bots/public-stats",
        "/api/bots/marketplace?page=1&limit=20",
    ]

    for endpoint in endpoints:
        url = f"{base_url.rstrip('/')}{endpoint}"
        request = Request(url, headers={"User-Agent": "prod-diagnostics"})
        start = time.perf_counter()
        try:
            with urlopen(request, timeout=timeout_seconds) as response:
                body = response.read(300).decode("utf-8", errors="replace")
                print(f"{endpoint} | status: {response.status} | {_ms(start)} ms | body: {body}")
        except HTTPError as http_error:
            error_body = http_error.read(300).decode("utf-8", errors="replace")
            print(f"{endpoint} | status: {http_error.code} | {_ms(start)} ms | body: {error_body}")
        except URLError as url_error:
            print(f"{endpoint} | status: failed | {_ms(start)} ms | error: {url_error}")
        except Exception as error:
            print(f"{endpoint} | status: failed | {_ms(start)} ms | error: {error}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Production DB/API diagnostics for marketplace endpoints")
    parser.add_argument(
        "--base-url",
        default="",
        help="Optional base URL for HTTP checks, e.g. https://botai.rostsin.com",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="Timeout in seconds for DB connect and HTTP requests",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        check_environment()
        check_runtime_import_chain()
        check_inprocess_wsgi(timeout_seconds=args.timeout)
        check_database_queries(timeout_seconds=args.timeout)

        if args.base_url:
            check_http_endpoints(base_url=args.base_url, timeout_seconds=args.timeout)

        _print_header("Summary")
        print("If DB queries are fast but HTTP endpoints timeout, issue is likely cPanel/LiteSpeed/Passenger runtime limits.")
        print("If DB queries are slow or lock test fails, issue is DB lock/path/permissions under production workload.")
        return 0
    except Exception as error:
        _print_header("Failure")
        print(f"Diagnostics failed: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
