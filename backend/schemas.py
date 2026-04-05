from pydantic import BaseModel, Field
from typing import Optional, Any, List
from datetime import date, datetime


# --- User Schemas ---

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    role: Optional[str] = Field(None, pattern=r"^(citizen|lawyer)$")


# --- FIR Schemas ---

class FIRCreate(BaseModel):
    fir_number: Optional[str] = Field(None, max_length=50)
    police_station: Optional[str] = Field(None, max_length=200)
    district: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    date_filed: Optional[date] = None
    complainant_name: Optional[str] = Field(None, max_length=200)
    accused_name: Optional[str] = Field(None, max_length=200)
    ipc_sections: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    offense_category: Optional[str] = Field(None, max_length=100)


class FIRResponse(BaseModel):
    id: int
    user_id: Optional[int]
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


# --- Saved Results ---

class SavedResultCreate(BaseModel):
    tool_name: str = Field(..., max_length=50)
    title: str = Field(..., max_length=300)
    result_data: Any


class SavedResultResponse(BaseModel):
    id: int
    tool_name: str
    title: str
    result_data: Any
    created_at: datetime

    class Config:
        from_attributes = True
