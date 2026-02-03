from fastapi import APIRouter, HTTPException, Depends, Request
import uuid
from datetime import datetime, timezone
import logging
import httpx
import hmac
import hashlib
import json

from core.database import db
from core.security import get_current_user
from core.config import NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET
from models.schemas import VoteRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1"


@router.get("/currencies")
async def get_available_currencies():
    """Get list of available cryptocurrencies from NOWPayments"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NOWPAYMENTS_API_URL}/currencies",
                headers={"x-api-key": NOWPAYMENTS_API_KEY},
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                # Return popular currencies first
                popular = ["btc", "eth", "usdt", "usdc", "bnb", "ltc", "trx", "doge", "sol", "matic"]
                currencies = data.get("currencies", [])
                sorted_currencies = [c for c in popular if c in currencies] + [c for c in currencies if c not in popular]
                return {"currencies": sorted_currencies[:50]}  # Limit to 50 for UI
            return {"currencies": ["btc", "eth", "usdt", "usdc", "bnb", "ltc"]}
    except Exception as e:
        logger.error(f"Error fetching currencies: {str(e)}")
        return {"currencies": ["btc", "eth", "usdt", "usdc", "bnb", "ltc"]}


@router.post("/create-order")
async def create_order(vote_request: VoteRequest, current_user: dict = Depends(get_current_user)):
    """Create a NOWPayments invoice for voting"""
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
    total_amount = round(base_amount + gateway_charge, 2)
    
    # NOWPayments has dynamic minimums (~$2-5 depending on cryptocurrency)
    # Setting minimum to $3 to ensure compatibility with most coins
    if total_amount < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum payment is $3.00 USD (crypto gateway requirement). Your amount ${total_amount:.2f} is below minimum. Please increase the number of votes."
        )
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    # Get preferred currency from request or default to BTC
    pay_currency = getattr(vote_request, 'pay_currency', 'btc') or 'btc'
    
    # Create NOWPayments invoice
    invoice_payload = {
        "price_amount": total_amount,
        "price_currency": "usd",
        "pay_currency": pay_currency,
        "order_id": order_id,
        "order_description": f"Vote for {poll['options'][vote_request.option_index]['name']} - {vote_request.num_votes} vote(s)",
        "ipn_callback_url": "https://votevault.preview.emergentagent.com/api/payments/webhook",
        "success_url": f"https://votevault.preview.emergentagent.com/payment-success?order_id={order_id}",
        "cancel_url": f"https://votevault.preview.emergentagent.com/poll/{vote_request.poll_id}",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NOWPAYMENTS_API_URL}/invoice",
                json=invoice_payload,
                headers={
                    "x-api-key": NOWPAYMENTS_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"NOWPayments API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create payment invoice")
            
            invoice_data = response.json()
        
        # Store order in database
        order_doc = {
            "id": order_id,
            "invoice_id": invoice_data.get("id"),
            "user_id": current_user["id"],
            "poll_id": vote_request.poll_id,
            "option_index": vote_request.option_index,
            "num_votes": vote_request.num_votes,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge,
            "total_amount": total_amount,
            "pay_currency": pay_currency,
            "payment_status": "waiting",
            "invoice_url": invoice_data.get("invoice_url"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.orders.insert_one(order_doc)
        
        return {
            "order_id": order_id,
            "invoice_id": invoice_data.get("id"),
            "invoice_url": invoice_data.get("invoice_url"),
            "amount": total_amount,
            "base_amount": base_amount,
            "gateway_charge": gateway_charge,
            "pay_currency": pay_currency
        }
    except httpx.HTTPError as e:
        logger.error(f"HTTP error creating NOWPayments invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify")
async def verify_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """Verify payment status by checking NOWPayments API"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found in database")
    
    if order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # If already verified as success, return immediately
    if order["payment_status"] in ["finished", "success"]:
        return {"status": "success", "message": "Payment already verified"}
    
    try:
        # Check payment status from NOWPayments API using invoice_id
        if order.get("invoice_id"):
            async with httpx.AsyncClient() as client:
                # Get payments for this invoice
                response = await client.get(
                    f"{NOWPAYMENTS_API_URL}/payment/?invoiceId={order['invoice_id']}",
                    headers={"x-api-key": NOWPAYMENTS_API_KEY},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    payments_data = response.json()
                    payments = payments_data.get("data", [])
                    
                    if payments:
                        # Check the latest payment status
                        latest_payment = payments[0]
                        payment_status = latest_payment.get("payment_status", "waiting")
                        
                        logger.info(f"NOWPayments status for order {order_id}: {payment_status}")
                        
                        if payment_status in ["finished", "confirmed"]:
                            if order["payment_status"] not in ["finished", "success"]:
                                await process_successful_payment(order)
                            return {"status": "success", "message": "Payment verified successfully"}
                        elif payment_status in ["waiting", "confirming", "sending"]:
                            return {"status": "pending", "message": f"Payment is {payment_status}"}
                        elif payment_status in ["failed", "expired", "refunded"]:
                            await db.orders.update_one(
                                {"id": order_id},
                                {"$set": {"payment_status": "failed"}}
                            )
                            return {"status": "failed", "message": f"Payment {payment_status}"}
                    
                    return {"status": "pending", "message": "Waiting for payment"}
                else:
                    logger.error(f"NOWPayments API error: {response.status_code}")
        
        return {"status": "pending", "message": "Payment verification in progress"}
            
    except Exception as e:
        logger.error(f"Error verifying payment for order {order_id}: {str(e)}")
        return {"status": "pending", "message": "Payment verification in progress"}


async def process_successful_payment(order: dict):
    """Process a successful payment - update vote counts and wallet"""
    order_id = order["id"]
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "finished", "verified_at": datetime.now(timezone.utc).isoformat()}}
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
        "payment_method": "nowpayments",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction_doc)


def verify_ipn_signature(request_body: bytes, signature: str) -> bool:
    """Verify NOWPayments IPN signature using HMAC-SHA512"""
    try:
        # Parse and sort the JSON
        data = json.loads(request_body.decode('utf-8'))
        sorted_json = json.dumps(data, separators=(',', ':'), sort_keys=True)
        
        # Compute HMAC-SHA512
        computed_signature = hmac.new(
            NOWPAYMENTS_IPN_SECRET.encode(),
            sorted_json.encode(),
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature.lower(), signature.lower())
    except Exception as e:
        logger.error(f"Signature verification error: {str(e)}")
        return False


@router.post("/webhook")
async def nowpayments_webhook(request: Request):
    """Handle NOWPayments IPN (Instant Payment Notification) webhook"""
    request_body = await request.body()
    webhook_signature = request.headers.get("x-nowpayments-sig", "")
    
    if not webhook_signature:
        logger.warning("Webhook received without signature")
        raise HTTPException(status_code=400, detail="Missing webhook signature")
    
    # Verify webhook signature
    if not verify_ipn_signature(request_body, webhook_signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=403, detail="Invalid webhook signature")
    
    try:
        ipn_data = json.loads(request_body.decode('utf-8'))
        
        payment_status = ipn_data.get("payment_status")
        payment_id = ipn_data.get("payment_id")
        order_id = ipn_data.get("order_id")
        actually_paid = ipn_data.get("actually_paid", 0)
        
        logger.info(f"Received NOWPayments IPN: order={order_id}, status={payment_status}")
        
        if not order_id:
            return {"status": "ignored", "reason": "No order_id"}
        
        # Find order by order_id
        order = await db.orders.find_one({"id": order_id})
        if not order:
            logger.warning(f"Order not found for order_id: {order_id}")
            return {"status": "ignored", "reason": "Order not found"}
        
        # Update order with payment details
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "payment_status": payment_status,
                    "payment_id": payment_id,
                    "actually_paid": actually_paid,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        if payment_status in ["finished", "confirmed"]:
            if order["payment_status"] not in ["finished", "success"]:
                await process_successful_payment(order)
                logger.info(f"Payment confirmed via IPN for order {order_id}")
            return {"status": "success", "event": "payment_confirmed"}
        
        elif payment_status == "failed":
            return {"status": "success", "event": "payment_failed"}
        
        elif payment_status in ["waiting", "confirming", "sending"]:
            return {"status": "success", "event": f"payment_{payment_status}"}
        
        return {"status": "success", "event": payment_status}
        
    except Exception as e:
        logger.error(f"Error processing IPN: {str(e)}")
        raise HTTPException(status_code=500, detail="IPN processing failed")
