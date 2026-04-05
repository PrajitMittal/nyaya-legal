import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash").strip()
INDIAN_KANOON_API_TOKEN = os.getenv("INDIAN_KANOON_API_TOKEN", "")

# Database — prefer Supabase PostgreSQL, fall back to SQLite for local dev
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "") or os.getenv("POSTGRES_URL", "")
if SUPABASE_DB_URL:
    DATABASE_URL = SUPABASE_DB_URL
else:
    DEFAULT_DB = "sqlite:///./legal_cases.db"
    if os.environ.get("VERCEL"):
        DEFAULT_DB = "sqlite:////tmp/legal_cases.db"
    DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB)

IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# Supabase Auth
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# CORS
CORS_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
] or ["*"]

UPLOAD_DIR = os.path.join("/tmp" if os.environ.get("VERCEL") else os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
