import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers import fir, search, analysis, tools
from models import FIR

Base.metadata.create_all(bind=engine)

# Auto-seed on Vercel (ephemeral /tmp DB)
if os.environ.get("VERCEL"):
    db = SessionLocal()
    if db.query(FIR).count() == 0:
        try:
            from seed_data import SAMPLE_FIRS
            from datetime import date as _date
            for f in SAMPLE_FIRS:
                fir_obj = FIR(**{**f, "date_filed": _date.fromisoformat(f["date_filed"]) if isinstance(f["date_filed"], str) else f["date_filed"]})
                db.add(fir_obj)
            db.commit()
        except Exception:
            db.rollback()
    db.close()

app = FastAPI(
    title="FIR Analyzer - Indian Legal Case System",
    description="Upload FIRs, find similar cases, get AI-powered legal analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fir.router, prefix="/api/fir", tags=["FIR"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(tools.router, prefix="/api/tools", tags=["Tools"])


@app.get("/")
def root():
    return {"message": "FIR Analyzer API is running", "docs": "/docs"}
