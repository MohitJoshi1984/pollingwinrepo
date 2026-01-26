from fastapi import APIRouter, HTTPException, Depends

from core.database import db
from core.security import get_current_user

router = APIRouter(prefix="/api", tags=["polls"])


@router.get("/polls")
async def get_polls():
    polls = await db.polls.find({}, {"_id": 0}).to_list(100)
    for poll in polls:
        total_votes = sum(option.get("votes_count", 0) for option in poll.get("options", []))
        poll["total_votes"] = total_votes
    return polls


@router.get("/polls/{poll_id}")
async def get_poll(poll_id: str, current_user: dict = Depends(get_current_user)):
    poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    total_votes = sum(option.get("votes_count", 0) for option in poll.get("options", []))
    poll["total_votes"] = total_votes
    
    total_amount_collected = sum(option.get("total_amount", 0) for option in poll.get("options", []))
    poll["total_amount_collected"] = total_amount_collected
    
    if poll.get("status") == "result_declared" and poll.get("winning_option") is not None:
        winning_option_idx = poll["winning_option"]
        winning_option = poll["options"][winning_option_idx]
        
        winning_votes = winning_option.get("votes_count", 0)
        if winning_votes > 0:
            winning_amount_per_vote = total_amount_collected / winning_votes
        else:
            winning_amount_per_vote = 0
        
        poll["result_details"] = {
            "winning_option_index": winning_option_idx,
            "winning_option_name": winning_option["name"],
            "winning_option_votes": winning_votes,
            "winning_option_amount": winning_option.get("total_amount", 0),
            "total_amount_collected": total_amount_collected,
            "winning_amount_per_vote": winning_amount_per_vote
        }
    
    raw_votes = await db.user_votes.find({"user_id": current_user["id"], "poll_id": poll_id}, {"_id": 0}).to_list(100)
    
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
        if vote.get("result") == "win":
            options_map[opt_idx]["result"] = "win"
        elif vote.get("result") == "loss" and options_map[opt_idx]["result"] != "win":
            options_map[opt_idx]["result"] = "loss"
    
    user_votes = list(options_map.values())
    user_votes.sort(key=lambda x: x["option_index"])
    poll["user_votes"] = user_votes
    
    poll["user_total_votes"] = sum(v.get("num_votes", 0) for v in user_votes)
    poll["user_total_paid"] = sum(v.get("amount_paid", 0) for v in user_votes)
    poll["user_total_winnings"] = sum(v.get("winning_amount", 0) for v in user_votes)
    
    return poll


@router.get("/my-polls")
async def get_my_polls(current_user: dict = Depends(get_current_user)):
    votes = await db.user_votes.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    polls_map = {}
    for vote in votes:
        poll_id = vote["poll_id"]
        option_index = vote["option_index"]
        
        if poll_id not in polls_map:
            poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
            if poll:
                winning_amount_per_vote = 0
                if poll.get("status") == "result_declared" and poll.get("winning_option") is not None:
                    total_amount = sum(opt.get("total_amount", 0) for opt in poll.get("options", []))
                    winning_votes = poll["options"][poll["winning_option"]].get("votes_count", 0)
                    if winning_votes > 0:
                        winning_amount_per_vote = total_amount / winning_votes
                
                polls_map[poll_id] = {
                    "poll_id": poll_id,
                    "poll": poll,
                    "options_voted": {},
                    "total_votes": 0,
                    "total_amount_paid": 0,
                    "total_winning_amount": 0,
                    "first_voted_at": vote["voted_at"],
                    "overall_result": "pending",
                    "winning_amount_per_vote": winning_amount_per_vote
                }
        
        if poll_id in polls_map:
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
            
            opt = polls_map[poll_id]["options_voted"][option_index]
            opt["num_votes"] += vote["num_votes"]
            opt["amount_paid"] += vote["amount_paid"]
            
            if vote.get("result") == "win":
                opt["result"] = "win"
            elif vote.get("result") == "loss" and opt["result"] != "win":
                opt["result"] = "loss"
            
            if vote["voted_at"] < opt["first_voted_at"]:
                opt["first_voted_at"] = vote["voted_at"]
            
            polls_map[poll_id]["total_votes"] += vote["num_votes"]
            polls_map[poll_id]["total_amount_paid"] += vote["amount_paid"]
            
            if vote["voted_at"] < polls_map[poll_id]["first_voted_at"]:
                polls_map[poll_id]["first_voted_at"] = vote["voted_at"]
            
            if vote.get("result") == "win":
                polls_map[poll_id]["overall_result"] = "win"
            elif vote.get("result") == "loss" and polls_map[poll_id]["overall_result"] != "win":
                polls_map[poll_id]["overall_result"] = "loss"
    
    for poll_id in polls_map:
        options_list = list(polls_map[poll_id]["options_voted"].values())
        options_list.sort(key=lambda x: x["option_index"])
        
        winning_amount_per_vote = polls_map[poll_id].get("winning_amount_per_vote", 0)
        total_winning_amount = 0
        for opt in options_list:
            if opt["result"] == "win":
                opt["winning_amount"] = opt["num_votes"] * winning_amount_per_vote
                total_winning_amount += opt["winning_amount"]
        
        polls_map[poll_id]["votes"] = options_list
        polls_map[poll_id]["total_winning_amount"] = total_winning_amount
        del polls_map[poll_id]["options_voted"]
        del polls_map[poll_id]["winning_amount_per_vote"]
    
    result = list(polls_map.values())
    result.sort(key=lambda x: x["first_voted_at"], reverse=True)
    
    return result
