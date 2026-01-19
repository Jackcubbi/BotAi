import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"))

# Server Configuration
PORT = int(os.getenv("PORT", "8080"))

# Security - JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", str(60 * 24 * 7)))  # 7 days default

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8080")
CORS_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

# Database Configuration
_raw_database_path = os.getenv("DATABASE_PATH", os.path.join("data", "ecommerce.db")).strip()

# cPanel envs sometimes provide absolute Linux paths without leading slash (e.g. home/user/app/data.db)
if _raw_database_path.startswith("home/"):
	_raw_database_path = os.sep + _raw_database_path

DATABASE_PATH = _raw_database_path if os.path.isabs(_raw_database_path) else os.path.join(BASE_DIR, _raw_database_path)
DATABASE_PATH = os.path.realpath(DATABASE_PATH)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Optional: Email Configuration (for future implementation)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL")

# Optional: Payment Configuration (for future implementation)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")

# Optional: AWS S3 Configuration (for future implementation)
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
