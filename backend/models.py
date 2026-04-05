from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class FIR(Base):
    __tablename__ = "firs"

    id = Column(Integer, primary_key=True, index=True)
    fir_number = Column(String(50), index=True)
    police_station = Column(String(200))
    district = Column(String(100))
    state = Column(String(100))
    date_filed = Column(Date, nullable=True)
    complainant_name = Column(String(200))
    accused_name = Column(String(200))
    ipc_sections = Column(String(500))  # comma-separated
    description = Column(Text)
    offense_category = Column(String(100))
    pdf_path = Column(String(500), nullable=True)
    source = Column(String(20), default="manual")  # "upload" or "manual"
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="fir", uselist=False)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    fir_id = Column(Integer, ForeignKey("firs.id"), unique=True)
    similar_cases = Column(JSON, nullable=True)
    ai_analysis = Column(JSON, nullable=True)
    conviction_rate = Column(Float, nullable=True)
    expected_duration = Column(String(100), nullable=True)
    bail_likelihood = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fir = relationship("FIR", back_populates="analysis")
