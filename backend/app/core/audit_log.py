"""
Verdant Backend – Security Audit Logging
Tracks security-relevant events for monitoring and compliance.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("security.audit")


class AuditEventType(str, Enum):
    """Types of security events to audit."""
    
    # Authentication events
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    TOKEN_REFRESH = "TOKEN_REFRESH"
    TOKEN_REFRESH_FAILED = "TOKEN_REFRESH_FAILED"
    
    # Account events
    ACCOUNT_CREATED = "ACCOUNT_CREATED"
    ACCOUNT_UPDATED = "ACCOUNT_UPDATED"
    ACCOUNT_DELETED = "ACCOUNT_DELETED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"
    PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED"
    
    # Authorization events
    ACCESS_DENIED = "ACCESS_DENIED"
    PRIVILEGE_ESCALATION_ATTEMPT = "PRIVILEGE_ESCALATION_ATTEMPT"
    
    # Rate limiting events
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Data access events
    SENSITIVE_DATA_ACCESS = "SENSITIVE_DATA_ACCESS"
    DATA_EXPORT = "DATA_EXPORT"
    
    # Administrative events
    ADMIN_ACTION = "ADMIN_ACTION"
    CONFIG_CHANGE = "CONFIG_CHANGE"
    
    # Security incidents
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    BRUTE_FORCE_DETECTED = "BRUTE_FORCE_DETECTED"
    INVALID_TOKEN_USED = "INVALID_TOKEN_USED"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AuditEvent(BaseModel):
    """Structured audit event record."""
    
    event_type: AuditEventType
    severity: AuditSeverity
    timestamp: datetime
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    success: bool = True
    
    def to_log_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging."""
        return {
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "user_email": self.user_email,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "resource": self.resource,
            "action": self.action,
            "details": self.details,
            "success": self.success,
        }


class SecurityAuditLogger:
    """
    Security audit logger for tracking security-relevant events.
    
    Logs events in a structured format suitable for:
    - Security monitoring (SIEM integration)
    - Compliance reporting
    - Incident investigation
    """
    
    def __init__(self):
        self._audit_logger = get_logger("security.audit")
    
    def log_event(self, event: AuditEvent) -> None:
        """
        Log a security audit event.
        
        Args:
            event: The audit event to log
        """
        log_data = event.to_log_dict()
        log_message = json.dumps(log_data, default=str)
        
        if event.severity == AuditSeverity.CRITICAL:
            self._audit_logger.critical("[AUDIT] %s", log_message)
        elif event.severity == AuditSeverity.WARNING:
            self._audit_logger.warning("[AUDIT] %s", log_message)
        else:
            self._audit_logger.info("[AUDIT] %s", log_message)
    
    def log_login_success(
        self,
        user_id: str,
        user_email: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> None:
        """Log successful login."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.LOGIN_SUCCESS,
            severity=AuditSeverity.INFO,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            action="login",
            success=True
        ))
    
    def log_login_failed(
        self,
        user_email: str,
        ip_address: str = None,
        user_agent: str = None,
        reason: str = None
    ) -> None:
        """Log failed login attempt."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.LOGIN_FAILED,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.now(timezone.utc),
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            action="login",
            success=False,
            details={"reason": reason} if reason else None
        ))
    
    def log_account_locked(
        self,
        user_email: str,
        ip_address: str = None,
        attempt_count: int = None
    ) -> None:
        """Log account lockout."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.ACCOUNT_LOCKED,
            severity=AuditSeverity.CRITICAL,
            timestamp=datetime.now(timezone.utc),
            user_email=user_email,
            ip_address=ip_address,
            action="account_locked",
            success=True,
            details={"attempt_count": attempt_count} if attempt_count else None
        ))
    
    def log_access_denied(
        self,
        user_id: str = None,
        user_email: str = None,
        ip_address: str = None,
        resource: str = None,
        required_role: str = None
    ) -> None:
        """Log access denied event."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.ACCESS_DENIED,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            resource=resource,
            action="access_denied",
            success=False,
            details={"required_role": required_role} if required_role else None
        ))
    
    def log_rate_limit_exceeded(
        self,
        ip_address: str,
        endpoint: str = None
    ) -> None:
        """Log rate limit exceeded event."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.RATE_LIMIT_EXCEEDED,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.now(timezone.utc),
            ip_address=ip_address,
            resource=endpoint,
            action="rate_limit_exceeded",
            success=False
        ))
    
    def log_brute_force_detected(
        self,
        ip_address: str,
        target_email: str = None,
        attempt_count: int = None
    ) -> None:
        """Log potential brute force attack detection."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.BRUTE_FORCE_DETECTED,
            severity=AuditSeverity.CRITICAL,
            timestamp=datetime.now(timezone.utc),
            user_email=target_email,
            ip_address=ip_address,
            action="brute_force_detected",
            success=False,
            details={"attempt_count": attempt_count} if attempt_count else None
        ))
    
    def log_invalid_token(
        self,
        ip_address: str = None,
        token_type: str = None,
        reason: str = None
    ) -> None:
        """Log invalid token usage."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.INVALID_TOKEN_USED,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.now(timezone.utc),
            ip_address=ip_address,
            action="invalid_token",
            success=False,
            details={"token_type": token_type, "reason": reason}
        ))
    
    def log_account_created(
        self,
        user_id: str,
        user_email: str,
        ip_address: str = None,
        role: str = None
    ) -> None:
        """Log account creation."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.ACCOUNT_CREATED,
            severity=AuditSeverity.INFO,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            action="account_created",
            success=True,
            details={"role": role} if role else None
        ))
    
    def log_password_changed(
        self,
        user_id: str,
        user_email: str,
        ip_address: str = None
    ) -> None:
        """Log password change."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.PASSWORD_CHANGED,
            severity=AuditSeverity.INFO,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            action="password_changed",
            success=True
        ))
    
    def log_suspicious_activity(
        self,
        ip_address: str = None,
        user_id: str = None,
        user_email: str = None,
        description: str = None
    ) -> None:
        """Log suspicious activity."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            severity=AuditSeverity.CRITICAL,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            action="suspicious_activity",
            success=False,
            details={"description": description} if description else None
        ))
    
    def log_admin_action(
        self,
        admin_id: str,
        admin_email: str,
        action: str,
        target_resource: str = None,
        ip_address: str = None,
        details: Dict[str, Any] = None
    ) -> None:
        """Log administrative action."""
        self.log_event(AuditEvent(
            event_type=AuditEventType.ADMIN_ACTION,
            severity=AuditSeverity.INFO,
            timestamp=datetime.now(timezone.utc),
            user_id=admin_id,
            user_email=admin_email,
            ip_address=ip_address,
            resource=target_resource,
            action=action,
            success=True,
            details=details
        ))


# Singleton instance
audit_logger = SecurityAuditLogger()
