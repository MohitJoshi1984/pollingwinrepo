import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

COINBASE_COMMERCE_API_KEY = os.getenv("COINBASE_COMMERCE_API_KEY")
COINBASE_WEBHOOK_SECRET = os.getenv("COINBASE_WEBHOOK_SECRET")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
