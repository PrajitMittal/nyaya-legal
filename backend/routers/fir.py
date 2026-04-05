import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import FIR, Analysis, User
from schemas import FIRCreate, FIRResponse
from services.pdf_parser import extract_text_from_pdf, parse_fir_fields
from config import UPLOAD_DIR
from auth import get_optional_user

router = APIRouter()


@router.post("/upload", response_model=FIRResponse)
async def upload_fir(file: UploadFile = File(...), db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    """Upload an FIR PDF, extract fields, and store."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text and parse fields
    try:
        text = extract_text_from_pdf(filepath)
        fields = parse_fir_fields(text)
    except Exception as e:
        # If parsing fails, still save with raw text as description
        fields = {"description": f"PDF parsing failed: {str(e)}. Please edit manually."}

    fir = FIR(
        user_id=user.id if user else None,
        fir_number=fields.get("fir_number"),
        police_station=fields.get("police_station"),
        district=fields.get("district"),
        state=fields.get("state"),
        date_filed=_parse_date(fields.get("date_filed")),
        complainant_name=fields.get("complainant_name"),
        accused_name=fields.get("accused_name"),
        ipc_sections=fields.get("ipc_sections"),
        description=fields.get("description"),
        offense_category=fields.get("offense_category"),
        pdf_path=filepath,
        source="upload",
    )
    db.add(fir)
    db.commit()
    db.refresh(fir)
    return fir


@router.post("/manual", response_model=FIRResponse)
def create_fir_manual(fir_data: FIRCreate, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    """Create an FIR from manual form entry."""
    fir = FIR(
        user_id=user.id if user else None,
        fir_number=fir_data.fir_number,
        police_station=fir_data.police_station,
        district=fir_data.district,
        state=fir_data.state,
        date_filed=fir_data.date_filed,
        complainant_name=fir_data.complainant_name,
        accused_name=fir_data.accused_name,
        ipc_sections=fir_data.ipc_sections,
        description=fir_data.description,
        offense_category=fir_data.offense_category,
        source="manual",
    )
    db.add(fir)
    db.commit()
    db.refresh(fir)
    return fir


@router.get("/", response_model=List[FIRResponse])
def list_firs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    """List FIRs. If authenticated, show only user's FIRs."""
    q = db.query(FIR)
    if user:
        q = q.filter(FIR.user_id == user.id)
    return q.order_by(FIR.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{fir_id}", response_model=FIRResponse)
def get_fir(fir_id: int, db: Session = Depends(get_db)):
    """Get a single FIR by ID."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    return fir


@router.delete("/{fir_id}")
def delete_fir(fir_id: int, db: Session = Depends(get_db)):
    """Delete an FIR."""
    fir = db.query(FIR).filter(FIR.id == fir_id).first()
    if not fir:
        raise HTTPException(status_code=404, detail="FIR not found")
    # Delete associated analysis records first
    db.query(Analysis).filter(Analysis.fir_id == fir_id).delete()
    db.delete(fir)
    db.commit()
    return {"message": "FIR deleted"}


def _parse_date(date_str):
    """Try to parse a date string into a date object."""
    if not date_str:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%Y-%m-%d", "%d/%m/%y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None
