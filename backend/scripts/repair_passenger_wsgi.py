import os
import shutil
from datetime import datetime, timezone

from _bootstrap import add_backend_to_path

add_backend_to_path()


def _utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def main() -> int:
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_path = os.path.join(backend_dir, "passenger_wsgi.py")

    safe_content = (
        "import os\n"
        "import sys\n\n"
        "BASE_DIR = os.path.dirname(os.path.abspath(__file__))\n"
        "if BASE_DIR not in sys.path:\n"
        "    sys.path.insert(0, BASE_DIR)\n\n"
        "from app_entry import application\n"
    )

    print(f"Backend dir: {backend_dir}")
    print(f"Target: {target_path}")

    if os.path.exists(target_path):
        backup_path = f"{target_path}.bak.{_utc_stamp()}"
        shutil.copy2(target_path, backup_path)
        print(f"Backup created: {backup_path}")

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(safe_content)

    print("passenger_wsgi.py rewritten with safe non-recursive entrypoint.")

    try:
        import importlib
        importlib.invalidate_caches()
        importlib.import_module("passenger_wsgi")
        print("Import verification: OK")
    except ModuleNotFoundError as error:
        if "a2wsgi" in str(error):
            print("Import verification: SKIPPED (a2wsgi missing in current environment)")
            return 0
        print(f"Import verification: FAILED | {error}")
        return 1
    except Exception as error:
        print(f"Import verification: FAILED | {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
