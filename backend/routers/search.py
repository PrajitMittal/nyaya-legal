from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import FIR
from services.indian_kanoon import search_kanoon, build_search_query

router = APIRouter()


@router.get("/kanoon")
async def search_indian_kanoon(
    q: str = Query(None, description="Search query"),
    ipc_sections: str = Query(None, description="IPC sections to search"),
):
    """Search Indian Kanoon for cases."""
    query = q or ""
    if ipc_sections:
        query = build_search_query(ipc_sections, query)
    if not query:
        raise HTTPException(status_code=400, detail="Provide a query or IPC sections")
    results = await search_kanoon(query)
    return {"query": query, "results": results, "count": len(results)}


@router.get("/similar/{fir_id}")
async def find_similar_cases(fir_id: int, db: Session = Depends(get_db)):
    """Find similar cases for a given FIR from Indian Kanoon."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    query = build_search_query(
        fir.ipc_sections or "",
        fir.description or ""
    )
    results = await search_kanoon(query)
    return {
        "fir_id": fir_id,
        "query": query,
        "similar_cases": results,
        "count": len(results),
    }
