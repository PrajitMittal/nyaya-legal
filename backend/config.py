import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
INDIAN_KANOON_API_TOKEN = os.getenv("INDIAN_KANOON_API_TOKEN", "")
DEFAULT_DB = "sqlite:///./legal_cases.db"
if os.environ.get("VERCEL"):
    DEFAULT_DB = "sqlite:////tmp/legal_cases.db"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB)

UPLOAD_DIR = os.path.join("/tmp" if os.environ.get("VERCEL") else os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
