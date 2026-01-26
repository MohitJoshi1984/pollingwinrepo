from pydantic import BaseModel, EmailStr
from typing import Optional, List


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


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    cash_wallet: Optional[float] = None
    kyc_status: Optional[str] = None
