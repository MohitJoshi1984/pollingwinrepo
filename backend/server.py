from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from core.config import CORS_ORIGINS
from routes import auth, polls, payments, users, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="The Polling Winner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(polls.router)
app.include_router(payments.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.on_event("startup")
async def startup_event():
    await admin.create_default_admin()


@app.on_event("shutdown")
async def shutdown_event():
    pass
