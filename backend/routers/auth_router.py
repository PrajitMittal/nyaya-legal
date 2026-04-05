from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import User
from schemas import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name is not None:
        user.name = data.name
    if data.role is not None:
        user.role = data.role
    db.commit()
    db.refresh(user)
    return user
