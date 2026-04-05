import sys
import os

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

# Set Vercel environment
os.environ["VERCEL"] = "1"
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/legal_cases.db")

from main import app
