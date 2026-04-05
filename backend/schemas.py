from pydantic import BaseModel
from typing import Optional, Any
from datetime import date, datetime


# --- FIR Schemas ---

class FIRCreate(BaseModel):
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    date_filed: Optional[date] = None
    complainant_name: Optional[str] = None
    accused_name: Optional[str] = None
    ipc_sections: Optional[str] = None
    description: Optional[str] = None
    offense_category: Optional[str] = None


class FIRResponse(BaseModel):
    id: int
    fir_number: Optional[str]
    police_station: Optional[str]
    district: Optional[str]
    state: Optional[str]
    date_filed: Optional[date]
    complainant_name: Optional[str]
    accused_name: Optional[str]
    ipc_sections: Optional[str]
    description: Optional[str]
    offense_category: Optional[str]
    pdf_path: Optional[str]
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Analysis Schemas ---

class AnalysisResponse(BaseModel):
    id: int
    fir_id: int
    similar_cases: Optional[Any]
    ai_analysis: Optional[Any]
    conviction_rate: Optional[float]
    expected_duration: Optional[str]
    bail_likelihood: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Search Schemas ---

class KanoonSearchResult(BaseModel):
    title: str
    doc_id: str
    headline: Optional[str]
    court: Optional[str]
    date: Optional[str]
    citations: Optional[str]
