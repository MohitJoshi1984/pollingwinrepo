from fastapi import APIRouter, HTTPException, Depends, Request
import uuid
from datetime import datetime, timezone
import logging
import httpx
import hmac
import hashlib

from core.database import db
from core.security import get_current_user
from core.config import COINBASE_COMMERCE_API_KEY, COINBASE_WEBHOOK_SECRET
from models.schemas import VoteRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

COINBASE_API_URL = "https://api.commerce.coinbase.com"


@router.post("/create-order")
async def create_order(vote_request: VoteRequest, current_user: dict = Depends(get_current_user)):
    """Create a Coinbase Commerce charge for voting"""
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
    
    # Convert INR to USD (approximate rate - in production, use a real exchange rate API)
    # For now, we'll use a fixed rate of 1 USD = 83 INR
    usd_amount = round(total_amount / 83, 2)
    if usd_amount < 1:
        usd_amount = 1.00  # Minimum $1 charge
    
    # Create Coinbase Commerce charge
    charge_payload = {
        "name": f"Poll Vote - {poll['title']}",
        "description": f"Vote for {poll['options'][vote_request.option_index]['name']} ({vote_request.num_votes} votes)",
        "pricing_type": "fixed_price",
        "local_price": {
            "amount": str(usd_amount),
            "currency": "USD"
        },
        "redirect_url": f"https://votevault.preview.emergentagent.com/payment-success?order_id={order_id}",
        "cancel_url": f"https://votevault.preview.emergentagent.com/poll/{vote_request.poll_id}",
        "metadata": {
            "order_id": order_id,
            "user_id": current_user["id"],
            "poll_id": vote_request.poll_id,
            "option_index": str(vote_request.option_index),
            "num_votes": str(vote_request.num_votes)
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COINBASE_API_URL}/charges",
                json=charge_payload,
                headers={
                    "X-CC-Api-Key": COINBASE_COMMERCE_API_KEY,
                    "Content-Type": "application/json",
                    "X-CC-Version": "2018-03-22"
                },
                timeout=30.0
            )
            
            if response.status_code != 201:
                logger.error(f"Coinbase API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create payment charge")
            
            charge_data = response.json()["data"]
        
        # Store order in database
        order_doc = {
            "id": order_id,
            "charge_id": charge_data["id"],
            "charge_code": charge_data["code"],
            "user_id": current_user["id"],
            "poll_id": vote_request.poll_id,
            "option_index": vote_request.option_index,
            "num_votes": vote_request.num_votes,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge,
            "total_amount": total_amount,
            "usd_amount": usd_amount,
            "payment_status": "pending",
            "hosted_url": charge_data["hosted_url"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.insert_one(order_doc)
        
        return {
            "order_id": order_id,
            "charge_code": charge_data["code"],
            "hosted_url": charge_data["hosted_url"],
            "amount": total_amount,
            "usd_amount": usd_amount,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge
        }
    except httpx.HTTPError as e:
        logger.error(f"HTTP error creating Coinbase charge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify")
async def verify_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """Verify payment status by checking Coinbase Commerce API"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found in database")
    
    if order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # If already verified as success, return immediately
    if order["payment_status"] == "success":
        return {"status": "success", "message": "Payment already verified"}
    
    try:
        # Check charge status from Coinbase Commerce API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COINBASE_API_URL}/charges/{order['charge_code']}",
                headers={
                    "X-CC-Api-Key": COINBASE_COMMERCE_API_KEY,
                    "X-CC-Version": "2018-03-22"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Coinbase API error: {response.status_code} - {response.text}")
                return {"status": "pending", "message": "Unable to verify payment status"}
            
            charge_data = response.json()["data"]
        
        # Check timeline for payment status
        timeline = charge_data.get("timeline", [])
        current_status = timeline[-1]["status"] if timeline else "NEW"
        
        logger.info(f"Coinbase charge status for order {order_id}: {current_status}")
        
        if current_status == "COMPLETED":
            # Payment confirmed
            if order["payment_status"] != "success":
                await process_successful_payment(order, current_user)
            return {"status": "success", "message": "Payment verified successfully"}
        elif current_status in ["PENDING", "UNRESOLVED"]:
            return {"status": "pending", "message": "Payment is being processed on the blockchain"}
        elif current_status in ["EXPIRED", "CANCELED"]:
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"payment_status": "failed"}}
            )
            return {"status": "failed", "message": f"Payment {current_status.lower()}"}
        else:
            return {"status": "pending", "message": "Waiting for payment"}
            
    except Exception as e:
        logger.error(f"Error verifying payment for order {order_id}: {str(e)}")
        return {"status": "pending", "message": "Payment verification in progress"}


async def process_successful_payment(order: dict, current_user: dict = None):
    """Process a successful payment - update vote counts and wallet"""
    order_id = order["id"]
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "success", "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Check if vote already exists for this user+poll+option
    existing_vote = await db.user_votes.find_one({
        "user_id": order["user_id"], 
        "poll_id": order["poll_id"],
        "option_index": order["option_index"]
    })
    
    if existing_vote:
        await db.user_votes.update_one(
            {"user_id": order["user_id"], "poll_id": order["poll_id"], "option_index": order["option_index"]},
            {
                "$inc": {"num_votes": order["num_votes"], "amount_paid": order["base_amount"]},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    else:
        vote_doc = {
            "id": str(uuid.uuid4()),
            "user_id": order["user_id"],
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
    
    # Update poll vote counts
    await db.polls.update_one(
        {"id": order["poll_id"]},
        {
            "$inc": {
                f"options.{order['option_index']}.votes_count": order["num_votes"],
                f"options.{order['option_index']}.total_amount": order["base_amount"]
            }
        }
    )
    
    # Record transaction
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "user_id": order["user_id"],
        "type": "vote",
        "amount": order["base_amount"],
        "gateway_charge": order["gateway_charge"],
        "status": "completed",
        "payment_id": order["id"],
        "payment_method": "coinbase_commerce",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction_doc)


def verify_webhook_signature(request_body: bytes, signature: str) -> bool:
    """Verify Coinbase Commerce webhook signature"""
    computed_signature = hmac.new(
        COINBASE_WEBHOOK_SECRET.encode(),
        request_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(computed_signature, signature)


@router.post("/webhook")
async def coinbase_webhook(request: Request):
    """Handle Coinbase Commerce webhook notifications"""
    request_body = await request.body()
    webhook_signature = request.headers.get("X-CC-Webhook-Signature")
    
    if not webhook_signature:
        logger.warning("Webhook received without signature")
        raise HTTPException(status_code=400, detail="Missing webhook signature")
    
    # Verify webhook signature
    if not verify_webhook_signature(request_body, webhook_signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=403, detail="Invalid webhook signature")
    
    try:
        import json
        webhook_data = json.loads(request_body.decode('utf-8'))
        
        event_type = webhook_data.get("event", {}).get("type")
        charge_data = webhook_data.get("event", {}).get("data", {})
        charge_code = charge_data.get("code")
        
        logger.info(f"Received Coinbase webhook: {event_type} for charge {charge_code}")
        
        if not charge_code:
            return {"status": "ignored", "reason": "No charge code"}
        
        # Find order by charge_code
        order = await db.orders.find_one({"charge_code": charge_code})
        if not order:
            logger.warning(f"Order not found for charge_code: {charge_code}")
            return {"status": "ignored", "reason": "Order not found"}
        
        if event_type == "charge:confirmed":
            if order["payment_status"] != "success":
                await process_successful_payment(order)
                logger.info(f"Payment confirmed via webhook for order {order['id']}")
            return {"status": "success", "event": event_type}
        
        elif event_type == "charge:failed":
            await db.orders.update_one(
                {"charge_code": charge_code},
                {"$set": {"payment_status": "failed"}}
            )
            return {"status": "success", "event": event_type}
        
        elif event_type == "charge:pending":
            await db.orders.update_one(
                {"charge_code": charge_code},
                {"$set": {"payment_status": "pending_blockchain"}}
            )
            return {"status": "success", "event": event_type}
        
        return {"status": "success", "event": event_type}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
