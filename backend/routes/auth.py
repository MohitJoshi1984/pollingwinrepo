from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from core.database import db
from core.security import get_password_hash, verify_password, create_access_token, get_current_user
from models.schemas import UserRegister, UserLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password_hash": hashed_password,
        "name": user.name,
        "phone": user.phone,
        "role": "user",
        "cash_wallet": 0.0,
        "upi_id": None,
        "kyc_status": "not_submitted",
        "kyc_details": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if db_user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin users must login via admin portal")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.get("role", "user")}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
