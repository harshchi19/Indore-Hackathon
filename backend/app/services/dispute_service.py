from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
import uuid

from app.models.disputes import DisputeDocument, EvidenceItem, AuditLogEntry
from app.schemas.disputes import (
    DisputeCreate,
    EvidenceAdd,
    DisputeResponse,
    DisputeStatusUpdate,
    DisputeResolve,
    EvidenceResponse,
    AuditLogResponse
)


# In-memory store for testing
_disputes_store: Dict[str, dict] = {}


class DisputeService:
    """Service for dispute resolution operations."""
    
    @staticmethod
    def _generate_id() -> str:
        return str(ObjectId())
    
    @staticmethod
    def _generate_evidence_id() -> str:
        return f"EVI-{uuid.uuid4().hex[:12].upper()}"
    
    @staticmethod
    async def create_dispute(data: DisputeCreate) -> DisputeResponse:
        """Create a new dispute ticket."""
        dispute_id = DisputeService._generate_id()
        now = datetime.utcnow()
        
        dispute = DisputeDocument(
            id=ObjectId(dispute_id),
            contract_id=ObjectId(data.contract_id),
            raised_by=ObjectId(data.raised_by),
            raised_against=ObjectId(data.raised_against),
            status="open",
            dispute_type=data.dispute_type,
            priority=data.priority,
            description=data.description,
            evidence=[],
            audit_log=[],
            created_at=now,
            updated_at=now
        )
        
        # Add initial audit entry
        dispute.add_audit_entry(
            actor=ObjectId(data.raised_by),
            action="Dispute created",
            actor_role="user",
            new_status="open"
        )
        
        dispute_data = dispute.to_mongo()
        dispute_data["_id"] = dispute_id
        # Convert embedded objects to dicts
        dispute_data["audit_log"] = [
            entry.model_dump() if hasattr(entry, 'model_dump') else entry
            for entry in dispute_data.get("audit_log", [])
        ]
        _disputes_store[dispute_id] = dispute_data
        
        return DisputeService._to_response(dispute_data)
    
    @staticmethod
    async def get_dispute(dispute_id: str) -> DisputeResponse:
        """Get dispute by ID."""
        dispute = _disputes_store.get(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute {dispute_id} not found"
            )
        return DisputeService._to_response(dispute)
    
    @staticmethod
    async def list_disputes(
        raised_by: Optional[str] = None,
        raised_against: Optional[str] = None,
        status_filter: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List disputes with filters."""
        disputes = list(_disputes_store.values())
        
        if raised_by:
            disputes = [d for d in disputes if str(d.get("raised_by")) == raised_by]
        if raised_against:
            disputes = [d for d in disputes if str(d.get("raised_against")) == raised_against]
        if status_filter:
            disputes = [d for d in disputes if d.get("status") == status_filter]
        if priority:
            disputes = [d for d in disputes if d.get("priority") == priority]
        
        # Sort by created_at descending
        disputes.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        total = len(disputes)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = disputes[start:end]
        
        return {
            "disputes": [DisputeService._to_response(d) for d in paginated],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    async def add_evidence(data: EvidenceAdd) -> DisputeResponse:
        """Add evidence to a dispute."""
        dispute = _disputes_store.get(data.dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute {data.dispute_id} not found"
            )
        
        if dispute.get("status") == "resolved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add evidence to resolved dispute"
            )
        
        now = datetime.utcnow()
        
        # Create evidence item
        evidence = {
            "id": DisputeService._generate_evidence_id(),
            "file_url": data.file_url,
            "file_type": data.file_type,
            "description": data.description,
            "uploaded_by": data.uploaded_by,
            "uploaded_at": now
        }
        
        dispute.setdefault("evidence", []).append(evidence)
        
        # Add audit entry
        audit_entry = {
            "timestamp": now,
            "actor": data.uploaded_by,
            "actor_role": "user",
            "action": "Evidence added",
            "details": f"New evidence uploaded: {evidence['id']}"
        }
        dispute.setdefault("audit_log", []).append(audit_entry)
        dispute["updated_at"] = now
        
        _disputes_store[data.dispute_id] = dispute
        return DisputeService._to_response(dispute)
    
    @staticmethod
    async def update_status(data: DisputeStatusUpdate) -> DisputeResponse:
        """Update dispute status with audit logging."""
        dispute = _disputes_store.get(data.dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute {data.dispute_id} not found"
            )
        
        previous_status = dispute.get("status")
        now = datetime.utcnow()
        
        # Validate status transition
        valid_transitions = {
            "open": ["reviewing", "resolved", "rejected"],
            "reviewing": ["open", "resolved", "rejected", "escalated"],
            "escalated": ["reviewing", "resolved", "rejected"],
            "resolved": [],  # Cannot change from resolved
            "rejected": []  # Cannot change from rejected
        }
        
        if data.new_status not in valid_transitions.get(previous_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {previous_status} to {data.new_status}"
            )
        
        dispute["status"] = data.new_status
        
        # Add audit entry
        audit_entry = {
            "timestamp": now,
            "actor": data.actor_id,
            "actor_role": data.actor_role,
            "action": f"Status changed to {data.new_status}",
            "details": data.details,
            "previous_status": previous_status,
            "new_status": data.new_status
        }
        dispute.setdefault("audit_log", []).append(audit_entry)
        dispute["updated_at"] = now
        
        _disputes_store[data.dispute_id] = dispute
        return DisputeService._to_response(dispute)
    
    @staticmethod
    async def resolve_dispute(data: DisputeResolve) -> DisputeResponse:
        """Resolve a dispute (admin action)."""
        dispute = _disputes_store.get(data.dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute {data.dispute_id} not found"
            )
        
        if dispute.get("status") in ["resolved", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dispute is already resolved or rejected"
            )
        
        previous_status = dispute.get("status")
        now = datetime.utcnow()
        
        dispute["status"] = "resolved"
        dispute["resolution"] = data.resolution
        dispute["resolved_by"] = data.resolved_by
        dispute["resolved_at"] = now
        
        # Add audit entry
        audit_entry = {
            "timestamp": now,
            "actor": data.resolved_by,
            "actor_role": "admin",
            "action": f"Dispute resolved - Outcome: {data.outcome}",
            "details": data.resolution,
            "previous_status": previous_status,
            "new_status": "resolved"
        }
        dispute.setdefault("audit_log", []).append(audit_entry)
        dispute["updated_at"] = now
        
        _disputes_store[data.dispute_id] = dispute
        return DisputeService._to_response(dispute)
    
    @staticmethod
    def _to_response(dispute: dict) -> DisputeResponse:
        evidence_list = [
            EvidenceResponse(
                id=e.get("id", ""),
                file_url=e.get("file_url", ""),
                file_type=e.get("file_type", "document"),
                description=e.get("description"),
                uploaded_by=str(e.get("uploaded_by", "")),
                uploaded_at=e.get("uploaded_at", datetime.utcnow())
            )
            for e in dispute.get("evidence", [])
        ]
        
        audit_list = [
            AuditLogResponse(
                timestamp=a.get("timestamp", datetime.utcnow()),
                actor=str(a.get("actor", "")),
                actor_role=a.get("actor_role", "user"),
                action=a.get("action", ""),
                details=a.get("details"),
                previous_status=a.get("previous_status"),
                new_status=a.get("new_status")
            )
            for a in dispute.get("audit_log", [])
        ]
        
        return DisputeResponse(
            _id=str(dispute["_id"]),
            contract_id=str(dispute["contract_id"]),
            raised_by=str(dispute["raised_by"]),
            raised_against=str(dispute["raised_against"]),
            status=dispute["status"],
            dispute_type=dispute.get("dispute_type", "general"),
            priority=dispute.get("priority", "medium"),
            description=dispute["description"],
            resolution=dispute.get("resolution"),
            resolved_by=str(dispute["resolved_by"]) if dispute.get("resolved_by") else None,
            resolved_at=dispute.get("resolved_at"),
            evidence=evidence_list,
            audit_log=audit_list,
            created_at=dispute["created_at"],
            updated_at=dispute["updated_at"]
        )


dispute_service = DisputeService()
