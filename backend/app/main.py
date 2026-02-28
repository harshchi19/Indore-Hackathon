from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import contracts, smart_meter, certificates, payments, disputes, analytics, workers

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Verdant Backend - Part B (MongoDB Version)

### Energy Trading Platform API

This API provides endpoints for:

- **Contracts**: Create, sign, and settle energy trading contracts
- **Smart Meters**: Ingest meter readings with anti-fraud detection
- **Certificates**: Issue and verify I-REC/G-GO green energy certificates
- **Payments**: Handle payments with escrow functionality
- **Disputes**: Dispute resolution with evidence and audit logs
- **Analytics**: Carbon impact and trading analytics

### Testing

Use the endpoints below to test the complete flow:

1. Create a contract
2. Sign the contract (buyer + producer)
3. Submit smart meter readings
4. Settle the contract
5. Issue certificate
6. Verify certificate
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Contracts", "description": "Energy trading contract management"},
        {"name": "Smart Meters", "description": "Smart meter reading ingestion and anti-fraud"},
        {"name": "Certificates", "description": "I-REC/G-GO certificate issuance and verification"},
        {"name": "Payments", "description": "Payment and escrow management"},
        {"name": "Disputes", "description": "Dispute resolution system"},
        {"name": "Carbon Analytics", "description": "CO2 impact and trading analytics"},
        {"name": "Workers (Background Jobs)", "description": "Background job management"},
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(contracts.router, prefix="/api/v1")
app.include_router(smart_meter.router, prefix="/api/v1")
app.include_router(certificates.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(disputes.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(workers.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "running",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "database": "in-memory (MongoDB stub)",
        "cache": "in-memory (Redis stub)"
    }


@app.get("/api/v1/test/setup", tags=["Testing"])
async def test_setup():
    """
    Setup test data for API testing.
    Creates sample contracts, readings, etc.
    """
    from datetime import datetime
    from bson import ObjectId
    
    # Create test IDs
    buyer_id = str(ObjectId())
    producer_id = str(ObjectId())
    
    # Import services
    from app.services.contract_service import ContractService
    from app.services.smart_meter_service import SmartMeterService
    from app.schemas.contracts import ContractCreate
    from app.schemas.smart_meter import SmartMeterDeviceCreate, SmartMeterReadingCreate
    
    # 1. Create a test contract
    contract = await ContractService.create_contract(
        ContractCreate(
            buyer_id=buyer_id,
            producer_id=producer_id,
            volume_kwh=1000.0,
            price_per_kwh=4.5,
            contract_type="spot"
        )
    )
    
    # 2. Register a smart meter device
    device = await SmartMeterService.register_device(
        SmartMeterDeviceCreate(
            device_id=f"SM-TEST-{datetime.utcnow().strftime('%H%M%S')}",
            producer_id=producer_id,
            device_type="electricity",
            location="Test Location"
        )
    )
    
    # 3. Submit a test reading
    reading = await SmartMeterService.submit_reading(
        SmartMeterReadingCreate(
            device_id=device.device_id,
            producer_id=producer_id,
            reading_kwh=500.0
        )
    )
    
    return {
        "message": "Test data created successfully",
        "test_data": {
            "buyer_id": buyer_id,
            "producer_id": producer_id,
            "contract_id": contract.id,
            "device_id": device.device_id,
            "reading_id": reading.id
        },
        "next_steps": [
            f"POST /api/v1/contracts/{contract.id}/sign - Sign as buyer",
            f"POST /api/v1/contracts/{contract.id}/sign - Sign as producer",
            f"POST /api/v1/contracts/{contract.id}/settle?force=true - Settle contract",
            "POST /api/v1/workers/certificates/issue-for-settled - Issue certificate"
        ]
    }


@app.get("/api/v1/test/full-flow", tags=["Testing"])
async def test_full_flow():
    """
    Run a complete end-to-end test flow.
    Demonstrates: Contract → Sign → Settle → Certificate → Verify
    """
    from datetime import datetime
    from bson import ObjectId
    
    # Import services
    from app.services.contract_service import ContractService
    from app.services.certificate_service import CertificateService
    from app.services.payment_service import PaymentService
    from app.schemas.contracts import ContractCreate, ContractSign
    from app.schemas.certificates import CertificateCreate
    from app.schemas.payments import PaymentInitiate
    
    # Create IDs
    buyer_id = str(ObjectId())
    producer_id = str(ObjectId())
    
    results = {"steps": []}
    
    # Step 1: Create contract
    contract = await ContractService.create_contract(
        ContractCreate(
            buyer_id=buyer_id,
            producer_id=producer_id,
            volume_kwh=500.0,
            price_per_kwh=4.20,
            contract_type="spot"
        )
    )
    results["steps"].append({
        "step": 1,
        "action": "Create Contract",
        "status": "success",
        "contract_id": contract.id,
        "contract_status": contract.status
    })
    
    # Step 2: Sign as buyer
    contract = await ContractService.sign_contract(
        contract.id,
        ContractSign(signer_id=buyer_id, signer_type="buyer")
    )
    results["steps"].append({
        "step": 2,
        "action": "Sign (Buyer)",
        "status": "success",
        "signature_buyer": contract.signature_buyer
    })
    
    # Step 3: Sign as producer
    contract = await ContractService.sign_contract(
        contract.id,
        ContractSign(signer_id=producer_id, signer_type="producer")
    )
    results["steps"].append({
        "step": 3,
        "action": "Sign (Producer)",
        "status": "success",
        "signature_producer": contract.signature_producer,
        "contract_status": contract.status
    })
    
    # Step 4: Settle contract
    settlement = await ContractService.settle_contract(contract.id, force=True)
    results["steps"].append({
        "step": 4,
        "action": "Settle Contract",
        "status": "success",
        "settlement_status": settlement.status
    })
    
    # Step 5: Issue certificate
    certificate = await CertificateService.issue_certificate(
        CertificateCreate(
            contract_id=contract.id,
            producer_id=producer_id,
            energy_amount_kwh=500.0,
            energy_source="solar"
        )
    )
    results["steps"].append({
        "step": 5,
        "action": "Issue Certificate",
        "status": "success",
        "certificate_id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "co2_avoided_kg": certificate.co2_avoided_kg
    })
    
    # Step 6: Verify certificate
    verification = await CertificateService.verify_certificate(certificate.id)
    results["steps"].append({
        "step": 6,
        "action": "Verify Certificate",
        "status": "success",
        "is_valid": verification.is_valid,
        "message": verification.message
    })
    
    # Step 7: Initiate payment
    payment = await PaymentService.initiate_payment(
        PaymentInitiate(
            contract_id=contract.id,
            buyer_id=buyer_id,
            producer_id=producer_id,
            amount=contract.total_amount
        )
    )
    results["steps"].append({
        "step": 7,
        "action": "Initiate Payment",
        "status": "success",
        "payment_id": payment.id,
        "amount": payment.amount,
        "transaction_id": payment.transaction_id
    })
    
    results["summary"] = {
        "contract_id": contract.id,
        "certificate_id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "payment_id": payment.id,
        "total_amount": contract.total_amount,
        "co2_avoided_kg": certificate.co2_avoided_kg,
        "all_steps_passed": True
    }
    
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
