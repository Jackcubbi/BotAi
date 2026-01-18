import os
import sys
import time

from a2wsgi import ASGIMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

print(f"[app_entry] loading at {time.time()} from {BASE_DIR}")

from main import app

application = ASGIMiddleware(app)
print("[app_entry] ASGI app wrapped for Passenger")
