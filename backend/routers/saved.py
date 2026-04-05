from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user, get_optional_user
from models import User, SavedResult
from schemas import SavedResultCreate, SavedResultResponse

router = APIRouter()


@router.get("/", response_model=List[SavedResultResponse])
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return db.query(SavedResult).filter(SavedResult.user_id == user.id).order_by(SavedResult.created_at.desc()).all()
    except Exception:
        # Table may not exist yet
        return []


@router.post("/", response_model=SavedResultResponse)
def save_result(data: SavedResultCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = SavedResult(
        user_id=user.id,
        tool_name=data.tool_name,
        title=data.title,
        result_data=data.result_data,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.delete("/{result_id}")
def delete_saved(result_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.query(SavedResult).filter(SavedResult.id == result_id, SavedResult.user_id == user.id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    db.delete(result)
    db.commit()
    return {"ok": True}
