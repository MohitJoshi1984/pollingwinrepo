from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone
import logging

from cashfree_pg.api_client import Cashfree
from cashfree_pg.models.create_order_request import CreateOrderRequest
from cashfree_pg.models.customer_details import CustomerDetails
from cashfree_pg.models.order_meta import OrderMeta

from core.database import db
from core.security import get_current_user
from core.config import CASHFREE_APP_ID, CASHFREE_SECRET_KEY
from models.schemas import VoteRequest

logger = logging.getLogger(__name__)

Cashfree.XClientId = CASHFREE_APP_ID
Cashfree.XClientSecret = CASHFREE_SECRET_KEY
Cashfree.XEnvironment = Cashfree.SANDBOX

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/create-order")
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
        return_url=f"https://poll-pro.preview.emergentagent.com/payment-success?order_id={order_id}",
        notify_url="https://poll-pro.preview.emergentagent.com/api/payments/webhook"
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


@router.post("/verify")
async def verify_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found in database")
    
    if order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
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
                    
                    existing_vote = await db.user_votes.find_one({
                        "user_id": current_user["id"], 
                        "poll_id": order["poll_id"],
                        "option_index": order["option_index"]
                    })
                    
                    if existing_vote:
                        await db.user_votes.update_one(
                            {"user_id": current_user["id"], "poll_id": order["poll_id"], "option_index": order["option_index"]},
                            {
                                "$inc": {"num_votes": order["num_votes"], "amount_paid": order["base_amount"]},
                                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                            }
                        )
                    else:
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
