from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import os

from config import CORS_ORIGINS, PORT
from database import init_db, close_db
from middleware.rate_limit import limiter
from routes import auth_routes, product_routes, order_routes, admin_routes, bot_routes, support_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting FastAPI server on port {PORT}...")
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")
    yield
    try:
        close_db()
        print("Database connection closed")
    except Exception as e:
        print(f"Database close failed: {e}")


enable_lifespan = os.getenv("ENABLE_APP_LIFESPAN", "0") == "1"

if enable_lifespan:
    app = FastAPI(title="E-Commerce API", version="1.0.0", lifespan=lifespan)
else:
    print("FastAPI lifespan disabled (set ENABLE_APP_LIFESPAN=1 to enable)")
    app = FastAPI(title="E-Commerce API", version="1.0.0")
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(order_routes.router)
app.include_router(admin_routes.router)
app.include_router(bot_routes.router)
app.include_router(support_routes.router)

@app.get("/")
async def root():
    return {"message": "E-Commerce API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
