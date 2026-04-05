import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers import fir, search, analysis, tools, saved, auth_router
from config import CORS_ORIGINS

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nyaya - Indian Legal Platform",
    description="AI-powered Indian legal tools: FIR analysis, bail calculator, case search, document drafting",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(fir.router, prefix="/api/fir", tags=["FIR"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(tools.router, prefix="/api/tools", tags=["Tools"])
app.include_router(saved.router, prefix="/api/saved", tags=["Saved Results"])


@app.get("/")
def root():
    return {"message": "Nyaya API is running", "docs": "/docs"}
