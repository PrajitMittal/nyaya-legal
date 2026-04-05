from sqlalchemy import Column, Integer, String, Text, Float, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    supabase_id = Column(String(255), unique=True, index=True)  # Supabase Auth UUID
    email = Column(String(255), unique=True, index=True)
    name = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), default="citizen")  # citizen / lawyer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    firs = relationship("FIR", back_populates="user")
    saved_results = relationship("SavedResult", back_populates="user")


class FIR(Base):
    __tablename__ = "firs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
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

    user = relationship("User", back_populates="firs")
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


class SavedResult(Base):
    __tablename__ = "saved_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    tool_name = Column(String(50))  # bail_calculator, fir_assistant, etc.
    title = Column(String(300))
    result_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_results")
