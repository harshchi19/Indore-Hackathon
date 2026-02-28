from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.core.config import settings

# Global database client (stub for now, will be connected in main.py)
client: Optional[AsyncIOMotorClient] = None
database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    """Connect to MongoDB. Call this on app startup."""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    print(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection. Call this on app shutdown."""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance. For dependency injection."""
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database


# Collection names
CONTRACTS_COLLECTION = "contracts"
SMART_METER_READINGS_COLLECTION = "smart_meter_readings"
CERTIFICATES_COLLECTION = "certificates"
PAYMENTS_COLLECTION = "payments"
DISPUTES_COLLECTION = "disputes"
