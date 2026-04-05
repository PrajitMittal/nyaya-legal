import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Set environment for serverless
os.environ.setdefault("DATABASE_URL", "sqlite:///./legal_cases.db")

from main import app
