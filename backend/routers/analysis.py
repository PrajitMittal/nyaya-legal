from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import FIR, Analysis
from schemas import AnalysisResponse
from services.indian_kanoon import search_kanoon, build_search_query
from services.claude_analyzer import analyze_fir

router = APIRouter()


@router.post("/{fir_id}", response_model=AnalysisResponse)
async def trigger_analysis(fir_id: int, db: Session = Depends(get_db)):
    """Trigger AI analysis for an FIR. Fetches similar cases and runs Claude analysis."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")

    # Check for existing analysis
    existing = db.query(Analysis).filter(Analysis.fir_id == fir_id).first()

    # Fetch similar cases from Indian Kanoon
    query = build_search_query(fir.ipc_sections or "", fir.description or "")
    similar_cases = await search_kanoon(query)

    # Run Claude analysis
    fir_data = {
        "fir_number": fir.fir_number,
        "police_station": fir.police_station,
        "district": fir.district,
        "state": fir.state,
        "date_filed": str(fir.date_filed) if fir.date_filed else None,
        "complainant_name": fir.complainant_name,
        "accused_name": fir.accused_name,
        "ipc_sections": fir.ipc_sections,
        "offense_category": fir.offense_category,
        "description": fir.description,
    }

    ai_analysis = await analyze_fir(fir_data, similar_cases)

    # Extract key metrics from analysis
    conviction_rate = None
    expected_duration = None
    bail_likelihood = None

    if isinstance(ai_analysis, dict) and "error" not in ai_analysis:
        cr = ai_analysis.get("conviction_rate", {})
        if isinstance(cr, dict):
            conviction_rate = cr.get("percentage")
        elif isinstance(cr, (int, float)):
            conviction_rate = float(cr)

        expected_duration = ai_analysis.get("expected_case_duration", "Unknown")

        ba = ai_analysis.get("bail_assessment", {})
        if isinstance(ba, dict):
            bail_likelihood = ba.get("likelihood", "Unknown")

    if existing:
        existing.similar_cases = similar_cases
        existing.ai_analysis = ai_analysis
        existing.conviction_rate = conviction_rate
        existing.expected_duration = expected_duration
        existing.bail_likelihood = bail_likelihood
    else:
        existing = Analysis(
            fir_id=fir_id,
            similar_cases=similar_cases,
            ai_analysis=ai_analysis,
            conviction_rate=conviction_rate,
            expected_duration=expected_duration,
            bail_likelihood=bail_likelihood,
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return existing


@router.get("/{fir_id}", response_model=AnalysisResponse)
def get_analysis(fir_id: int, db: Session = Depends(get_db)):
    """Get cached analysis for an FIR."""
    analysis = db.query(Analysis).filter(Analysis.fir_id == fir_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Trigger analysis first.")
    return analysis
