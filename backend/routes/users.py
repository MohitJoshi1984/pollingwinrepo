from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import uuid
from datetime import datetime, timezone

from core.database import db
from core.security import get_current_user
from models.schemas import KYCSubmit, WithdrawalRequest

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/profile")
async def update_profile(name: Optional[str] = None, upi_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if name:
        update_data["name"] = name
    if upi_id:
        update_data["upi_id"] = upi_id
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return updated_user


@router.post("/kyc/submit")
async def submit_kyc(kyc: KYCSubmit, current_user: dict = Depends(get_current_user)):
    kyc_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "pan_card": kyc.pan_card,
        "pan_name": kyc.pan_name,
        "aadhar_card": kyc.aadhar_card,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kyc_requests.insert_one(kyc_doc)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"kyc_status": "pending", "kyc_details": kyc.dict()}}
    )
    
    return {"message": "KYC submitted successfully"}


@router.post("/withdrawal/request")
async def request_withdrawal(withdrawal: WithdrawalRequest, current_user: dict = Depends(get_current_user)):
    if current_user["kyc_status"] != "approved":
        raise HTTPException(status_code=400, detail="KYC not approved. Please complete KYC verification first.")
    
    if not current_user.get("upi_id"):
        raise HTTPException(status_code=400, detail="Please add UPI ID in your profile")
    
    if current_user["cash_wallet"] < withdrawal.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"withdrawal_charge_percent": 10}
    
    withdrawal_charge = withdrawal.amount * (settings["withdrawal_charge_percent"] / 100)
    net_amount = withdrawal.amount - withdrawal_charge
    
    withdrawal_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "amount": withdrawal.amount,
        "withdrawal_charge": withdrawal_charge,
        "net_amount": net_amount,
        "upi_id": current_user["upi_id"],
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.withdrawal_requests.insert_one(withdrawal_doc)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"cash_wallet": -withdrawal.amount}}
    )
    
    return {"message": "Withdrawal request submitted", "net_amount": net_amount}


@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    withdrawals = await db.withdrawal_requests.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    transactions = await db.transactions.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        "balance": current_user["cash_wallet"],
        "withdrawals": withdrawals,
        "transactions": transactions
    }


@router.get("/settings/public")
async def get_public_settings():
    """Public endpoint to get payment gateway charge for users"""
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"payment_gateway_charge_percent": 2, "withdrawal_charge_percent": 10}
    return {
        "payment_gateway_charge_percent": settings.get("payment_gateway_charge_percent", 2),
        "withdrawal_charge_percent": settings.get("withdrawal_charge_percent", 10)
    }
