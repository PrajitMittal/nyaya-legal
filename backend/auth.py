from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from config import SUPABASE_JWT_SECRET
from database import get_db
from models import User


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT."""
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def _get_or_create_user(db: Session, payload: dict) -> User:
    """Find existing user by Supabase ID or create a new one."""
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing subject")

    user = db.query(User).filter(User.supabase_id == sub).first()
    if not user:
        email = payload.get("email", "")
        meta = payload.get("user_metadata", {})
        user = User(
            supabase_id=sub,
            email=email,
            name=meta.get("full_name") or meta.get("name") or email.split("@")[0],
            avatar_url=meta.get("avatar_url") or meta.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Require authentication. Returns the User row."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Auth not configured on server")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    return _get_or_create_user(db, payload)


def get_optional_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> User | None:
    """Optional authentication. Returns User or None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = _decode_token(token)
        return _get_or_create_user(db, payload)
    except HTTPException:
        return None
