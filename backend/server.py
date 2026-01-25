from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import base64
from cashfree_pg.api_client import Cashfree
from cashfree_pg.models.create_order_request import CreateOrderRequest
from cashfree_pg.models.customer_details import CustomerDetails
from cashfree_pg.models.order_meta import OrderMeta
import uuid
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

Cashfree.XClientId = os.getenv("CASHFREE_APP_ID")
Cashfree.XClientSecret = os.getenv("CASHFREE_SECRET_KEY")
Cashfree.XEnvironment = Cashfree.SANDBOX

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Poll(BaseModel):
    title: str
    description: str
    image_url: str
    options: List[str]
    vote_price: float
    end_datetime: str

class VoteRequest(BaseModel):
    poll_id: str
    option_index: int
    num_votes: int

class KYCSubmit(BaseModel):
    pan_card: str
    pan_name: str
    aadhar_card: str

class WithdrawalRequest(BaseModel):
    amount: float

class SettingsUpdate(BaseModel):
    payment_gateway_charge_percent: Optional[float] = None
    withdrawal_charge_percent: Optional[float] = None

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@app.post("/api/auth/register")
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

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Prevent admin from logging in via user login page
    if db_user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin users must login via admin portal")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.get("role", "user")}

@app.post("/api/admin/login")
async def admin_login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Only allow admin users to login via admin portal
    if db_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin credentials required.")
    
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/api/polls")
async def get_polls():
    polls = await db.polls.find({}, {"_id": 0}).to_list(100)
    for poll in polls:
        total_votes = sum(option.get("votes_count", 0) for option in poll.get("options", []))
        poll["total_votes"] = total_votes
    return polls

@app.get("/api/polls/{poll_id}")
async def get_poll(poll_id: str, current_user: dict = Depends(get_current_user)):
    poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    total_votes = sum(option.get("votes_count", 0) for option in poll.get("options", []))
    poll["total_votes"] = total_votes
    
    # Calculate total amount collected from all votes
    total_amount_collected = sum(option.get("total_amount", 0) for option in poll.get("options", []))
    poll["total_amount_collected"] = total_amount_collected
    
    # If result is declared, calculate result statistics
    if poll.get("status") == "result_declared" and poll.get("winning_option") is not None:
        winning_option_idx = poll["winning_option"]
        winning_option = poll["options"][winning_option_idx]
        
        # Calculate total losing amount (from all non-winning options)
        total_losing_amount = sum(
            option.get("total_amount", 0) 
            for i, option in enumerate(poll["options"]) 
            if i != winning_option_idx
        )
        
        # Calculate winning amount per vote
        winning_votes = winning_option.get("votes_count", 0)
        if winning_votes > 0:
            winning_amount_per_vote = total_losing_amount / winning_votes
        else:
            winning_amount_per_vote = 0
        
        # Add result details to poll
        poll["result_details"] = {
            "winning_option_index": winning_option_idx,
            "winning_option_name": winning_option["name"],
            "winning_option_votes": winning_votes,
            "winning_option_amount": winning_option.get("total_amount", 0),
            "total_losing_amount": total_losing_amount,
            "winning_amount_per_vote": winning_amount_per_vote,
            "total_distributed": total_losing_amount
        }
    
    # Get ALL user votes for this poll and group by option_index
    raw_votes = await db.user_votes.find({"user_id": current_user["id"], "poll_id": poll_id}, {"_id": 0}).to_list(100)
    
    # Group votes by option_index
    options_map = {}
    for vote in raw_votes:
        opt_idx = vote["option_index"]
        if opt_idx not in options_map:
            options_map[opt_idx] = {
                "option_index": opt_idx,
                "num_votes": 0,
                "amount_paid": 0,
                "result": vote.get("result", "pending"),
                "winning_amount": 0
            }
        options_map[opt_idx]["num_votes"] += vote["num_votes"]
        options_map[opt_idx]["amount_paid"] += vote["amount_paid"]
        options_map[opt_idx]["winning_amount"] += vote.get("winning_amount", 0)
        # Win takes precedence
        if vote.get("result") == "win":
            options_map[opt_idx]["result"] = "win"
        elif vote.get("result") == "loss" and options_map[opt_idx]["result"] != "win":
            options_map[opt_idx]["result"] = "loss"
    
    # Convert to sorted list
    user_votes = list(options_map.values())
    user_votes.sort(key=lambda x: x["option_index"])
    poll["user_votes"] = user_votes
    
    # Calculate totals
    poll["user_total_votes"] = sum(v.get("num_votes", 0) for v in user_votes)
    poll["user_total_paid"] = sum(v.get("amount_paid", 0) for v in user_votes)
    poll["user_total_winnings"] = sum(v.get("winning_amount", 0) for v in user_votes)
    
    return poll

@app.post("/api/payments/create-order")
async def create_order(vote_request: VoteRequest, current_user: dict = Depends(get_current_user)):
    poll = await db.polls.find_one({"id": vote_request.poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["status"] != "active":
        raise HTTPException(status_code=400, detail="Poll is not active")
    
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"payment_gateway_charge_percent": 2, "withdrawal_charge_percent": 10}
        await db.settings.insert_one(settings)
    
    base_amount = poll["vote_price"] * vote_request.num_votes
    gateway_charge = base_amount * (settings["payment_gateway_charge_percent"] / 100)
    total_amount = base_amount + gateway_charge
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    customer_details = CustomerDetails(
        customer_id=current_user["email"].replace("@", "_").replace(".", "_"),
        customer_phone=current_user.get("phone", "9999999999"),
        customer_email=current_user["email"]
    )
    
    order_meta = OrderMeta(
        return_url=f"https://votepulse-4.preview.emergentagent.com/payment-success?order_id={order_id}",
        notify_url="https://votepulse-4.preview.emergentagent.com/api/payments/webhook"
    )
    
    create_order_request = CreateOrderRequest(
        order_id=order_id,
        order_amount=round(total_amount, 2),
        order_currency="INR",
        customer_details=customer_details,
        order_meta=order_meta
    )
    
    try:
        api_response = Cashfree().PGCreateOrder("2023-08-01", create_order_request, None, None)
        
        order_doc = {
            "id": order_id,
            "cf_order_id": api_response.data.cf_order_id,
            "user_id": current_user["id"],
            "poll_id": vote_request.poll_id,
            "option_index": vote_request.option_index,
            "num_votes": vote_request.num_votes,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge,
            "total_amount": total_amount,
            "payment_status": "pending",
            "payment_session_id": api_response.data.payment_session_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.insert_one(order_doc)
        
        return {
            "order_id": order_id,
            "payment_session_id": api_response.data.payment_session_id,
            "amount": total_amount,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge
        }
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@app.post("/api/payments/verify")
async def verify_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found in database")
    
    if order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Use our order_id (which was passed to Cashfree during creation) to fetch payments
        api_response = Cashfree().PGOrderFetchPayments("2023-08-01", order_id, None)
        logger.info(f"Cashfree response for order {order_id}: {api_response.data}")
        
        if api_response.data and len(api_response.data) > 0:
            payment = api_response.data[0]
            payment_status = getattr(payment, 'payment_status', None)
            logger.info(f"Payment status: {payment_status}")
            
            if payment_status == "SUCCESS":
                if order["payment_status"] != "success":
                    await db.orders.update_one(
                        {"id": order_id},
                        {"$set": {"payment_status": "success", "verified_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    # Check for existing vote on the SAME option (user + poll + option combination)
                    existing_vote = await db.user_votes.find_one({
                        "user_id": current_user["id"], 
                        "poll_id": order["poll_id"],
                        "option_index": order["option_index"]
                    })
                    
                    if existing_vote:
                        # User already voted for this option, increment the votes
                        await db.user_votes.update_one(
                            {"user_id": current_user["id"], "poll_id": order["poll_id"], "option_index": order["option_index"]},
                            {
                                "$inc": {"num_votes": order["num_votes"], "amount_paid": order["base_amount"]},
                                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                            }
                        )
                    else:
                        # New vote for this option (could be different option on same poll)
                        vote_doc = {
                            "id": str(uuid.uuid4()),
                            "user_id": current_user["id"],
                            "poll_id": order["poll_id"],
                            "option_index": order["option_index"],
                            "num_votes": order["num_votes"],
                            "amount_paid": order["base_amount"],
                            "payment_id": order["id"],
                            "payment_status": "success",
                            "result": "pending",
                            "winning_amount": 0,
                            "voted_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.user_votes.insert_one(vote_doc)
                    
                    await db.polls.update_one(
                        {"id": order["poll_id"]},
                        {
                            "$inc": {
                                f"options.{order['option_index']}.votes_count": order["num_votes"],
                                f"options.{order['option_index']}.total_amount": order["base_amount"]
                            }
                        }
                    )
                    
                    transaction_doc = {
                        "id": str(uuid.uuid4()),
                        "user_id": current_user["id"],
                        "type": "vote",
                        "amount": order["base_amount"],
                        "gateway_charge": order["gateway_charge"],
                        "status": "completed",
                        "payment_id": order["id"],
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.transactions.insert_one(transaction_doc)
                
                return {"status": "success", "message": "Payment verified successfully"}
        
        return {"status": "pending", "message": "Payment is still pending"}
    except Exception as e:
        logger.error(f"Error verifying payment for order {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")

@app.get("/api/my-polls")
async def get_my_polls(current_user: dict = Depends(get_current_user)):
    votes = await db.user_votes.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Group votes by poll_id and then by option_index
    polls_map = {}
    for vote in votes:
        poll_id = vote["poll_id"]
        option_index = vote["option_index"]
        
        if poll_id not in polls_map:
            poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
            if poll:
                polls_map[poll_id] = {
                    "poll_id": poll_id,
                    "poll": poll,
                    "options_voted": {},  # Group by option_index
                    "total_votes": 0,
                    "total_amount_paid": 0,
                    "total_winning_amount": 0,
                    "first_voted_at": vote["voted_at"],
                    "overall_result": "pending"
                }
        
        if poll_id in polls_map:
            # Group votes by option_index
            if option_index not in polls_map[poll_id]["options_voted"]:
                polls_map[poll_id]["options_voted"][option_index] = {
                    "option_index": option_index,
                    "option_name": polls_map[poll_id]["poll"]["options"][option_index]["name"] if polls_map[poll_id]["poll"] else f"Option {option_index + 1}",
                    "num_votes": 0,
                    "amount_paid": 0,
                    "result": vote.get("result", "pending"),
                    "winning_amount": 0,
                    "first_voted_at": vote["voted_at"]
                }
            
            # Aggregate votes for this option
            opt = polls_map[poll_id]["options_voted"][option_index]
            opt["num_votes"] += vote["num_votes"]
            opt["amount_paid"] += vote["amount_paid"]
            opt["winning_amount"] += vote.get("winning_amount", 0)
            
            # Update result (win takes precedence)
            if vote.get("result") == "win":
                opt["result"] = "win"
            elif vote.get("result") == "loss" and opt["result"] != "win":
                opt["result"] = "loss"
            
            # Update first_voted_at if this vote is earlier
            if vote["voted_at"] < opt["first_voted_at"]:
                opt["first_voted_at"] = vote["voted_at"]
            
            # Update poll totals
            polls_map[poll_id]["total_votes"] += vote["num_votes"]
            polls_map[poll_id]["total_amount_paid"] += vote["amount_paid"]
            polls_map[poll_id]["total_winning_amount"] += vote.get("winning_amount", 0)
            
            # Update first_voted_at for poll
            if vote["voted_at"] < polls_map[poll_id]["first_voted_at"]:
                polls_map[poll_id]["first_voted_at"] = vote["voted_at"]
            
            # Determine overall result (win if any option won)
            if vote.get("result") == "win":
                polls_map[poll_id]["overall_result"] = "win"
            elif vote.get("result") == "loss" and polls_map[poll_id]["overall_result"] != "win":
                polls_map[poll_id]["overall_result"] = "loss"
    
    # Convert options_voted dict to sorted list
    for poll_id in polls_map:
        options_list = list(polls_map[poll_id]["options_voted"].values())
        options_list.sort(key=lambda x: x["option_index"])
        polls_map[poll_id]["votes"] = options_list
        del polls_map[poll_id]["options_voted"]
    
    # Convert to list and sort by most recent first
    result = list(polls_map.values())
    result.sort(key=lambda x: x["first_voted_at"], reverse=True)
    
    return result
    
    return result

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/api/profile")
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

@app.post("/api/kyc/submit")
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

@app.post("/api/withdrawal/request")
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

@app.get("/api/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    withdrawals = await db.withdrawal_requests.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    transactions = await db.transactions.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        "balance": current_user["cash_wallet"],
        "withdrawals": withdrawals,
        "transactions": transactions
    }

@app.post("/api/admin/polls")
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

@app.put("/api/admin/polls/{poll_id}")
async def update_poll(poll_id: str, poll: Poll, admin_user: dict = Depends(get_admin_user)):
    options_list = [{"name": opt, "votes_count": existing.get("votes_count", 0), "total_amount": existing.get("total_amount", 0)} for opt, existing in zip(poll.options, (await db.polls.find_one({"id": poll_id}) or {"options": []}).get("options", []))]
    
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

@app.delete("/api/admin/polls/{poll_id}")
async def delete_poll(poll_id: str, admin_user: dict = Depends(get_admin_user)):
    await db.polls.delete_one({"id": poll_id})
    return {"message": "Poll deleted successfully"}

@app.post("/api/admin/polls/{poll_id}/set-result")
async def set_poll_result(poll_id: str, winning_option_index: int, admin_user: dict = Depends(get_admin_user)):
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["status"] == "result_declared":
        raise HTTPException(status_code=400, detail="Result already declared")
    
    # Calculate total amount collected from ALL votes
    total_amount_collected = sum(
        option["total_amount"]
        for option in poll["options"]
    )
    
    winning_votes = poll["options"][winning_option_index]["votes_count"]
    
    # Distribute total amount among winners
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

@app.get("/api/admin/polls/{poll_id}/result-stats")
async def get_poll_result_stats(poll_id: str, admin_user: dict = Depends(get_admin_user)):
    poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["status"] != "result_declared":
        raise HTTPException(status_code=400, detail="Result not declared yet")
    
    # Get all votes for this poll
    all_votes = await db.user_votes.find({"poll_id": poll_id}, {"_id": 0}).to_list(1000)
    
    # Aggregate stats
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
    
    # Calculate per-option stats
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

@app.get("/api/admin/kyc-requests")
async def get_kyc_requests(admin_user: dict = Depends(get_admin_user)):
    requests = await db.kyc_requests.find({"status": "pending"}, {"_id": 0}).to_list(100)
    
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "email": 1, "name": 1})
        if user:
            req["user"] = user
    
    return requests

@app.post("/api/admin/kyc/{kyc_id}/approve")
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

@app.post("/api/admin/kyc/{kyc_id}/reject")
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

@app.get("/api/settings/public")
async def get_public_settings():
    """Public endpoint to get payment gateway charge for users"""
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"payment_gateway_charge_percent": 2, "withdrawal_charge_percent": 10}
    return {
        "payment_gateway_charge_percent": settings.get("payment_gateway_charge_percent", 2),
        "withdrawal_charge_percent": settings.get("withdrawal_charge_percent", 10)
    }

@app.get("/api/admin/users")
async def get_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@app.get("/api/admin/transactions")
async def get_all_transactions(admin_user: dict = Depends(get_admin_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    orders = await db.orders.find({"payment_status": "success"}, {"_id": 0}).to_list(100)
    
    total_vote_amount = sum(order.get("base_amount", 0) for order in orders)
    total_with_gateway = sum(order.get("total_amount", 0) for order in orders)
    total_votes = sum(order.get("num_votes", 0) for order in orders)
    
    return {
        "transactions": transactions,
        "stats": {
            "total_vote_amount": total_vote_amount,
            "total_with_gateway": total_with_gateway,
            "total_votes": total_votes
        }
    }

@app.get("/api/admin/settings")
async def get_settings(admin_user: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {"payment_gateway_charge_percent": 2, "withdrawal_charge_percent": 10}
        await db.settings.insert_one(settings)
    return settings

@app.put("/api/admin/settings")
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

@app.get("/api/admin/dashboard-stats")
async def get_dashboard_stats(admin_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "user"})
    total_polls = await db.polls.count_documents({})
    active_polls = await db.polls.count_documents({"status": "active"})
    pending_kyc = await db.kyc_requests.count_documents({"status": "pending"})
    
    orders = await db.orders.find({"payment_status": "success"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(order.get("base_amount", 0) for order in orders)
    
    return {
        "total_users": total_users,
        "total_polls": total_polls,
        "active_polls": active_polls,
        "pending_kyc": pending_kyc,
        "total_revenue": total_revenue
    }

@app.on_event("startup")
async def startup_event():
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

@app.on_event("shutdown")
async def shutdown_event():
    client.close()