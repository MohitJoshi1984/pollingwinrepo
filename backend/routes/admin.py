from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
import uuid
from datetime import datetime, timezone
import logging
import os
import aiofiles
from PIL import Image
import io

from core.database import db
from core.security import get_admin_user, verify_password, create_access_token, get_password_hash
from models.schemas import UserLogin, Poll, SettingsUpdate, UserUpdate, OrderUpdate, WithdrawalUpdate

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login")
async def admin_login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if db_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin credentials required.")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}


@router.post("/polls")
async def create_poll(poll: Poll, admin_user: dict = Depends(get_admin_user)):
    poll_id = str(uuid.uuid4())
    options_list = [{"name": opt, "votes_count": 0, "total_amount": 0} for opt in poll.options]
    
    poll_doc = {
        "id": poll_id,
        "title": poll.title,
        "description": poll.description,
        "image_url": poll.image_url,
        "options": options_list,
        "vote_price": poll.vote_price,
        "end_datetime": poll.end_datetime,
        "status": "active",
        "winning_option": None,
        "created_by": admin_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.polls.insert_one(poll_doc)
    return {"message": "Poll created successfully", "poll_id": poll_id}


@router.put("/polls/{poll_id}")
async def update_poll(poll_id: str, poll: Poll, admin_user: dict = Depends(get_admin_user)):
    existing_poll = await db.polls.find_one({"id": poll_id})
    if not existing_poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    existing_options = existing_poll.get("options", [])
    options_list = []
    for i, opt in enumerate(poll.options):
        existing = existing_options[i] if i < len(existing_options) else {"votes_count": 0, "total_amount": 0}
        options_list.append({
            "name": opt,
            "votes_count": existing.get("votes_count", 0),
            "total_amount": existing.get("total_amount", 0)
        })
    
    await db.polls.update_one(
        {"id": poll_id},
        {"$set": {
            "title": poll.title,
            "description": poll.description,
            "image_url": poll.image_url,
            "options": options_list,
            "vote_price": poll.vote_price,
            "end_datetime": poll.end_datetime
        }}
    )
    
    return {"message": "Poll updated successfully"}


@router.delete("/polls/{poll_id}")
async def delete_poll(poll_id: str, admin_user: dict = Depends(get_admin_user)):
    await db.polls.delete_one({"id": poll_id})
    return {"message": "Poll deleted successfully"}


@router.post("/polls/{poll_id}/set-result")
async def set_poll_result(poll_id: str, winning_option_index: int, admin_user: dict = Depends(get_admin_user)):
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["status"] == "result_declared":
        raise HTTPException(status_code=400, detail="Result already declared")
    
    total_amount_collected = sum(
        option["total_amount"]
        for option in poll["options"]
    )
    
    winning_votes = poll["options"][winning_option_index]["votes_count"]
    
    if winning_votes > 0:
        per_vote_winning = total_amount_collected / winning_votes
    else:
        per_vote_winning = 0
    
    await db.polls.update_one(
        {"id": poll_id},
        {"$set": {
            "status": "result_declared",
            "winning_option": winning_option_index,
            "result_declared_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    all_votes = await db.user_votes.find({"poll_id": poll_id}).to_list(1000)
    
    for vote in all_votes:
        if vote["option_index"] == winning_option_index:
            winning_amount = vote["num_votes"] * per_vote_winning
            
            await db.user_votes.update_one(
                {"id": vote["id"]},
                {"$set": {"result": "win", "winning_amount": winning_amount}}
            )
            
            await db.users.update_one(
                {"id": vote["user_id"]},
                {"$inc": {"cash_wallet": winning_amount}}
            )
            
            transaction_doc = {
                "id": str(uuid.uuid4()),
                "user_id": vote["user_id"],
                "type": "winning",
                "amount": winning_amount,
                "status": "completed",
                "poll_id": poll_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(transaction_doc)
        else:
            await db.user_votes.update_one(
                {"id": vote["id"]},
                {"$set": {"result": "loss"}}
            )
    
    return {"message": "Poll result set successfully"}


@router.get("/polls/{poll_id}/result-stats")
async def get_poll_result_stats(poll_id: str, admin_user: dict = Depends(get_admin_user)):
    poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["status"] != "result_declared":
        raise HTTPException(status_code=400, detail="Result not declared yet")
    
    all_votes = await db.user_votes.find({"poll_id": poll_id}, {"_id": 0}).to_list(1000)
    
    winners = []
    losers = []
    total_winning_amount = 0
    total_losing_amount = 0
    
    for vote in all_votes:
        user = await db.users.find_one({"id": vote["user_id"]}, {"_id": 0, "email": 1, "name": 1})
        vote_info = {
            "user_id": vote["user_id"],
            "user_email": user.get("email", "Unknown") if user else "Unknown",
            "user_name": user.get("name", "Unknown") if user else "Unknown",
            "option_index": vote["option_index"],
            "option_name": poll["options"][vote["option_index"]]["name"] if vote["option_index"] < len(poll["options"]) else "Unknown",
            "num_votes": vote["num_votes"],
            "amount_paid": vote["amount_paid"],
            "winning_amount": vote.get("winning_amount", 0),
            "result": vote.get("result", "pending")
        }
        
        if vote.get("result") == "win":
            winners.append(vote_info)
            total_winning_amount += vote.get("winning_amount", 0)
        else:
            losers.append(vote_info)
            total_losing_amount += vote["amount_paid"]
    
    option_stats = []
    for i, option in enumerate(poll["options"]):
        option_stats.append({
            "index": i,
            "name": option["name"],
            "votes_count": option["votes_count"],
            "total_amount": option["total_amount"],
            "is_winner": i == poll.get("winning_option")
        })
    
    return {
        "poll_id": poll_id,
        "poll_title": poll["title"],
        "winning_option": poll.get("winning_option"),
        "winning_option_name": poll["options"][poll.get("winning_option", 0)]["name"] if poll.get("winning_option") is not None else None,
        "result_declared_at": poll.get("result_declared_at"),
        "option_stats": option_stats,
        "total_winners": len(winners),
        "total_losers": len(losers),
        "total_winning_amount_distributed": total_winning_amount,
        "total_losing_amount_collected": total_losing_amount,
        "winners": winners,
        "losers": losers
    }


@router.get("/kyc-requests")
async def get_kyc_requests(
    status: str = Query(None, description="Filter by status: pending, approved, rejected, or all"),
    admin_user: dict = Depends(get_admin_user)
):
    # Build query based on status filter
    if status and status != "all":
        query = {"status": status}
    else:
        query = {}
    
    requests = await db.kyc_requests.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(100)
    
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "email": 1, "name": 1, "phone": 1})
        if user:
            req["user"] = user
    
    return requests


@router.post("/kyc/{kyc_id}/approve")
async def approve_kyc(kyc_id: str, admin_user: dict = Depends(get_admin_user)):
    kyc_req = await db.kyc_requests.find_one({"id": kyc_id})
    if not kyc_req:
        raise HTTPException(status_code=404, detail="KYC request not found")
    
    await db.kyc_requests.update_one(
        {"id": kyc_id},
        {"$set": {
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": admin_user["id"]
        }}
    )
    
    await db.users.update_one(
        {"id": kyc_req["user_id"]},
        {"$set": {"kyc_status": "approved"}}
    )
    
    return {"message": "KYC approved successfully"}


@router.post("/kyc/{kyc_id}/reject")
async def reject_kyc(kyc_id: str, admin_user: dict = Depends(get_admin_user)):
    kyc_req = await db.kyc_requests.find_one({"id": kyc_id})
    if not kyc_req:
        raise HTTPException(status_code=404, detail="KYC request not found")
    
    await db.kyc_requests.update_one(
        {"id": kyc_id},
        {"$set": {
            "status": "rejected",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": admin_user["id"]
        }}
    )
    
    await db.users.update_one(
        {"id": kyc_req["user_id"]},
        {"$set": {"kyc_status": "rejected"}}
    )
    
    return {"message": "KYC rejected"}


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user)
):
    skip = (page - 1) * limit
    total = await db.users.count_documents({"role": "user"})
    users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/users/{user_id}")
async def get_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id, "role": "user"}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate, admin_user: dict = Depends(get_admin_user)):
    existing_user = await db.users.find_one({"id": user_id, "role": "user"})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.phone is not None:
        update_data["phone"] = user_update.phone
    if user_update.upi_id is not None:
        update_data["upi_id"] = user_update.upi_id
    if user_update.cash_wallet is not None:
        update_data["cash_wallet"] = user_update.cash_wallet
    if user_update.kyc_status is not None:
        if user_update.kyc_status not in ["not_submitted", "pending", "approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid KYC status")
        update_data["kyc_status"] = user_update.kyc_status
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user


@router.get("/transactions")
async def get_all_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user)
):
    skip = (page - 1) * limit
    total = await db.transactions.count_documents({})
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich transactions with user info
    for txn in transactions:
        user = await db.users.find_one({"id": txn.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        txn["user"] = user
        if txn.get("poll_id"):
            poll = await db.polls.find_one({"id": txn["poll_id"]}, {"_id": 0, "title": 1})
            txn["poll"] = poll
    
    # Stats from all orders (not paginated)
    orders = await db.orders.find({"payment_status": "success"}, {"_id": 0}).to_list(1000)
    
    total_vote_amount = sum(order.get("base_amount", 0) for order in orders)
    total_with_gateway = sum(order.get("total_amount", 0) for order in orders)
    total_votes = sum(order.get("num_votes", 0) for order in orders)
    
    return {
        "items": transactions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "stats": {
            "total_vote_amount": total_vote_amount,
            "total_with_gateway": total_with_gateway,
            "total_votes": total_votes
        }
    }


@router.get("/orders")
async def get_all_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user)
):
    """Get all payment orders with user and poll details"""
    skip = (page - 1) * limit
    total = await db.orders.count_documents({})
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich orders with user and poll info
    for order in orders:
        user = await db.users.find_one({"id": order.get("user_id")}, {"_id": 0, "name": 1, "email": 1, "phone": 1})
        order["user"] = user
        poll = await db.polls.find_one({"id": order.get("poll_id")}, {"_id": 0, "title": 1})
        order["poll"] = poll
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.put("/orders/{order_id}")
async def update_order(order_id: str, order_update: OrderUpdate, admin_user: dict = Depends(get_admin_user)):
    """Update order details (Cashfree ID, status)"""
    existing_order = await db.orders.find_one({"id": order_id})
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {}
    if order_update.cf_order_id is not None:
        update_data["cf_order_id"] = order_update.cf_order_id
    if order_update.payment_status is not None:
        if order_update.payment_status not in ["pending", "success", "failed"]:
            raise HTTPException(status_code=400, detail="Invalid payment status")
        update_data["payment_status"] = order_update.payment_status
        
        # If marking as success and was previously not success, process the vote
        if order_update.payment_status == "success" and existing_order.get("payment_status") != "success":
            # Check if vote already exists
            existing_vote = await db.user_votes.find_one({
                "user_id": existing_order["user_id"],
                "poll_id": existing_order["poll_id"],
                "option_index": existing_order["option_index"]
            })
            
            if existing_vote:
                await db.user_votes.update_one(
                    {"user_id": existing_order["user_id"], "poll_id": existing_order["poll_id"], "option_index": existing_order["option_index"]},
                    {
                        "$inc": {"num_votes": existing_order["num_votes"], "amount_paid": existing_order["base_amount"]},
                        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                    }
                )
            else:
                vote_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": existing_order["user_id"],
                    "poll_id": existing_order["poll_id"],
                    "option_index": existing_order["option_index"],
                    "num_votes": existing_order["num_votes"],
                    "amount_paid": existing_order["base_amount"],
                    "payment_id": existing_order["id"],
                    "payment_status": "success",
                    "result": "pending",
                    "winning_amount": 0,
                    "voted_at": datetime.now(timezone.utc).isoformat()
                }
                await db.user_votes.insert_one(vote_doc)
            
            # Update poll vote count
            await db.polls.update_one(
                {"id": existing_order["poll_id"]},
                {
                    "$inc": {
                        f"options.{existing_order['option_index']}.votes_count": existing_order["num_votes"],
                        f"options.{existing_order['option_index']}.total_amount": existing_order["base_amount"]
                    }
                }
            )
            
            # Create transaction record
            transaction_doc = {
                "id": str(uuid.uuid4()),
                "user_id": existing_order["user_id"],
                "type": "vote",
                "amount": existing_order["base_amount"],
                "gateway_charge": existing_order.get("gateway_charge", 0),
                "status": "completed",
                "payment_id": existing_order["id"],
                "poll_id": existing_order["poll_id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(transaction_doc)
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_data["updated_by"] = admin_user["id"]
        await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated_order


@router.get("/settings")
async def get_settings(admin_user: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"payment_gateway_charge_percent": 2, "withdrawal_charge_percent": 10}
        await db.settings.insert_one(settings)
    return settings


@router.put("/settings")
async def update_settings(settings_update: SettingsUpdate, admin_user: dict = Depends(get_admin_user)):
    update_data = {}
    if settings_update.payment_gateway_charge_percent is not None:
        update_data["payment_gateway_charge_percent"] = settings_update.payment_gateway_charge_percent
    if settings_update.withdrawal_charge_percent is not None:
        update_data["withdrawal_charge_percent"] = settings_update.withdrawal_charge_percent
    
    if update_data:
        await db.settings.update_one({}, {"$set": update_data}, upsert=True)
    
    updated_settings = await db.settings.find_one({}, {"_id": 0})
    return updated_settings


@router.get("/dashboard-stats")
async def get_dashboard_stats(admin_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "user"})
    total_polls = await db.polls.count_documents({})
    active_polls = await db.polls.count_documents({"status": "active"})
    pending_kyc = await db.kyc_requests.count_documents({"status": "pending"})
    pending_withdrawals = await db.withdrawal_requests.count_documents({"status": "pending"})
    
    orders = await db.orders.find({"payment_status": "success"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(order.get("base_amount", 0) for order in orders)
    
    return {
        "total_users": total_users,
        "total_polls": total_polls,
        "active_polls": active_polls,
        "pending_kyc": pending_kyc,
        "pending_withdrawals": pending_withdrawals,
        "total_revenue": total_revenue
    }


@router.get("/withdrawals")
async def get_all_withdrawals(
    status: str = Query(None, description="Filter by status: pending, completed, rejected, or all"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user)
):
    """Get all withdrawal requests with user details"""
    skip = (page - 1) * limit
    
    # Build query based on status filter
    if status and status != "all":
        query = {"status": status}
    else:
        query = {}
    
    total = await db.withdrawal_requests.count_documents(query)
    withdrawals = await db.withdrawal_requests.find(query, {"_id": 0}).sort("requested_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user details
    for withdrawal in withdrawals:
        user = await db.users.find_one({"id": withdrawal.get("user_id")}, {"_id": 0, "name": 1, "email": 1, "phone": 1, "upi_id": 1})
        withdrawal["user"] = user
    
    # Get stats
    total_pending = await db.withdrawal_requests.count_documents({"status": "pending"})
    total_completed = await db.withdrawal_requests.count_documents({"status": "completed"})
    total_rejected = await db.withdrawal_requests.count_documents({"status": "rejected"})
    
    pending_amount = 0
    completed_amount = 0
    charges_collected = 0
    pending_requests = await db.withdrawal_requests.find({"status": "pending"}, {"_id": 0, "net_amount": 1}).to_list(1000)
    completed_requests = await db.withdrawal_requests.find({"status": "completed"}, {"_id": 0, "net_amount": 1, "withdrawal_charge": 1}).to_list(1000)
    pending_amount = sum(r.get("net_amount", 0) for r in pending_requests)
    completed_amount = sum(r.get("net_amount", 0) for r in completed_requests)
    charges_collected = sum(r.get("withdrawal_charge", 0) for r in completed_requests)
    
    return {
        "items": withdrawals,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "stats": {
            "total_pending": total_pending,
            "total_completed": total_completed,
            "total_rejected": total_rejected,
            "pending_amount": pending_amount,
            "completed_amount": completed_amount,
            "charges_collected": charges_collected
        }
    }


@router.put("/withdrawals/{withdrawal_id}")
async def update_withdrawal(withdrawal_id: str, withdrawal_update: WithdrawalUpdate, admin_user: dict = Depends(get_admin_user)):
    """Update withdrawal request (approve/reject with transaction ID)"""
    existing = await db.withdrawal_requests.find_one({"id": withdrawal_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    update_data = {}
    if withdrawal_update.status is not None:
        if withdrawal_update.status not in ["pending", "completed", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid status. Use: pending, completed, rejected")
        update_data["status"] = withdrawal_update.status
        
        # If rejecting, refund the amount to user's wallet
        if withdrawal_update.status == "rejected" and existing.get("status") == "pending":
            await db.users.update_one(
                {"id": existing["user_id"]},
                {"$inc": {"cash_wallet": existing["amount"]}}
            )
    
    if withdrawal_update.transaction_id is not None:
        update_data["transaction_id"] = withdrawal_update.transaction_id
    
    if withdrawal_update.remarks is not None:
        update_data["remarks"] = withdrawal_update.remarks
    
    if update_data:
        update_data["processed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["processed_by"] = admin_user["id"]
        await db.withdrawal_requests.update_one({"id": withdrawal_id}, {"$set": update_data})
    
    updated = await db.withdrawal_requests.find_one({"id": withdrawal_id}, {"_id": 0})
    return updated


async def create_default_admin():
    """Create default admin user on startup if not exists"""
    admin_exists = await db.users.find_one({"role": "admin"})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@pollingwinner.com",
            "password_hash": get_password_hash("admin123"),
            "name": "Admin",
            "phone": "1234567890",
            "role": "admin",
            "cash_wallet": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin created: admin@pollingwinner.com / admin123")
